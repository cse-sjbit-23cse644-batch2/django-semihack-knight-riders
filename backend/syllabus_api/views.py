from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from .models import CustomUser, Syllabus, AuditTrail
from .serializers import UserSerializer, SyllabusSerializer
from django.contrib.auth import authenticate

@api_view(['POST'])
def login_view(request):
    username = request.data.get('name')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        return Response({
            '_id': user.id,
            'name': user.username,
            'role': user.role,
            'token': 'fake-jwt-token-django'
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def register_view(request):
    username = request.data.get('name')
    password = request.data.get('password')
    role = request.data.get('role')
    
    if CustomUser.objects.filter(username=username).exists():
        return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
    user = CustomUser.objects.create_user(username=username, password=password, role=role)
    return Response({
        '_id': user.id,
        'name': user.username,
        'role': user.role,
        'token': 'fake-jwt-token-django'
    })

class SyllabusViewSet(viewsets.ModelViewSet):
    queryset = Syllabus.objects.all().order_by('-updatedAt')
    serializer_class = SyllabusSerializer

    def get_queryset(self):
        # We'll pass user id from frontend for now since we're using fake tokens
        user_id = self.request.query_params.get('user_id')
        if not user_id:
            return Syllabus.objects.none()
            
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Syllabus.objects.none()

        if user.role == 'Faculty':
            return Syllabus.objects.filter(faculty=user)
        elif user.role == 'BOS':
            return Syllabus.objects.filter(status='Pending_BOS')
        elif user.role == 'HOD':
            return Syllabus.objects.filter(status__in=['Pending_HOD', 'Approved'])
        else: # Admin
            return Syllabus.objects.all()

    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        user = CustomUser.objects.get(id=user_id)
        syllabus = serializer.save(faculty=user, status='Draft')
        AuditTrail.objects.create(
            syllabus=syllabus,
            action='Created Draft',
            userName=user.username
        )

    def perform_update(self, serializer):
        user_id = self.request.data.get('user_id')
        user = CustomUser.objects.get(id=user_id)
        syllabus = serializer.save()
        AuditTrail.objects.create(
            syllabus=syllabus,
            action='Updated Draft',
            userName=user.username
        )

    @action(detail=True, methods=['post'])
    def workflow(self, request, pk=None):
        syllabus = self.get_object()
        action_type = request.data.get('action')
        remarks = request.data.get('remarks', '')
        user_id = request.data.get('user_id')
        
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        new_status = syllabus.status
        audit_action = ''

        if action_type == 'submit' and user.role == 'Faculty':
            new_status = 'Pending_BOS'
            audit_action = 'Submitted to BOS'
        elif action_type == 'approve' and user.role == 'BOS':
            new_status = 'Pending_HOD'
            audit_action = 'Approved by BOS'
        elif action_type == 'approve' and user.role == 'HOD':
            new_status = 'Approved'
            audit_action = 'Approved by HOD'
        elif action_type == 'reject':
            if user.role == 'BOS':
                new_status = 'Rejected'
                audit_action = 'Rejected by BOS'
            elif user.role == 'HOD':
                new_status = 'Rejected'
                audit_action = 'Rejected by HOD'
            else:
                return Response({'error': 'Unauthorized'}, status=403)
        else:
            return Response({'error': 'Invalid action'}, status=400)

        syllabus.status = new_status
        syllabus.save()
        
        AuditTrail.objects.create(
            syllabus=syllabus,
            action=audit_action,
            userName=user.username,
            remarks=remarks
        )
        
        serializer = self.get_serializer(syllabus)
        return Response(serializer.data)
