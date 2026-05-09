from rest_framework import serializers
from .models import CustomUser, Syllabus, Module, CoPoMapping, AuditTrail

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'role']

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'title', 'teachingHours', 'objectives', 'contentDescription', 'handsOnExercises', 'selfLearningTopics', 'rbtLevels', 'order']

class CoPoMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoPoMapping
        fields = ['id', 'co', 'po1', 'po2', 'po3', 'po4', 'po5', 'po6', 'po7', 'po8', 'po9', 'po10', 'po11', 'po12', 'pso1', 'pso2']

class AuditTrailSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditTrail
        fields = ['id', 'action', 'userName', 'remarks', 'timestamp']

class SyllabusSerializer(serializers.ModelSerializer):
    faculty = UserSerializer(read_only=True)
    modules = ModuleSerializer(many=True, required=False)
    coPoMapping = CoPoMappingSerializer(many=True, required=False)
    auditTrail = AuditTrailSerializer(many=True, read_only=True)

    class Meta:
        model = Syllabus
        fields = ['id', '_id', 'courseTitle', 'courseCode', 'credits', 'cieMarks', 'seeMarks', 'department', 'faculty', 'status', 'updatedAt', 'createdAt', 'modules', 'coPoMapping', 'auditTrail']

    # Map id to _id for frontend compatibility
    _id = serializers.IntegerField(source='id', read_only=True)

    def create(self, validated_data):
        modules_data = validated_data.pop('modules', [])
        co_po_data = validated_data.pop('coPoMapping', [])
        
        syllabus = Syllabus.objects.create(**validated_data)
        
        for index, module_data in enumerate(modules_data):
            module_data['order'] = index
            Module.objects.create(syllabus=syllabus, **module_data)
            
        for mapping_data in co_po_data:
            CoPoMapping.objects.create(syllabus=syllabus, **mapping_data)
            
        return syllabus

    def update(self, instance, validated_data):
        modules_data = validated_data.pop('modules', [])
        co_po_data = validated_data.pop('coPoMapping', [])

        # Update syllabus fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update modules (simplified: delete and recreate)
        instance.modules.all().delete()
        for index, module_data in enumerate(modules_data):
            module_data['order'] = index
            Module.objects.create(syllabus=instance, **module_data)

        # Update CO-PO mapping (simplified: delete and recreate)
        instance.coPoMapping.all().delete()
        for mapping_data in co_po_data:
            CoPoMapping.objects.create(syllabus=instance, **mapping_data)

        return instance
