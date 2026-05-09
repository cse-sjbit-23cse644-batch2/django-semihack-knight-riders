from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('Admin', 'Admin'),
        ('HOD', 'HOD'),
        ('BOS', 'BOS'),
        ('Faculty', 'Faculty'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Faculty')

    def __str__(self):
        return f"{self.username} ({self.role})"

class Syllabus(models.Model):
    STATUS_CHOICES = (
        ('Draft', 'Draft'),
        ('Pending_BOS', 'Pending_BOS'),
        ('Pending_HOD', 'Pending_HOD'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    )
    
    courseTitle = models.CharField(max_length=255)
    courseCode = models.CharField(max_length=50)
    credits = models.IntegerField()
    cieMarks = models.IntegerField()
    seeMarks = models.IntegerField()
    department = models.CharField(max_length=100)
    
    faculty = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='syllabi')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Draft')
    updatedAt = models.DateTimeField(auto_now=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.courseCode} - {self.courseTitle}"

class Module(models.Model):
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    teachingHours = models.IntegerField()
    objectives = models.TextField(blank=True, null=True)
    contentDescription = models.TextField()
    handsOnExercises = models.TextField(blank=True, null=True)
    selfLearningTopics = models.TextField(blank=True, null=True)
    rbtLevels = models.CharField(max_length=100, blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

class CoPoMapping(models.Model):
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name='coPoMapping')
    co = models.CharField(max_length=50)
    po1 = models.CharField(max_length=10, blank=True, null=True)
    po2 = models.CharField(max_length=10, blank=True, null=True)
    po3 = models.CharField(max_length=10, blank=True, null=True)
    po4 = models.CharField(max_length=10, blank=True, null=True)
    po5 = models.CharField(max_length=10, blank=True, null=True)
    po6 = models.CharField(max_length=10, blank=True, null=True)
    po7 = models.CharField(max_length=10, blank=True, null=True)
    po8 = models.CharField(max_length=10, blank=True, null=True)
    po9 = models.CharField(max_length=10, blank=True, null=True)
    po10 = models.CharField(max_length=10, blank=True, null=True)
    po11 = models.CharField(max_length=10, blank=True, null=True)
    po12 = models.CharField(max_length=10, blank=True, null=True)
    pso1 = models.CharField(max_length=10, blank=True, null=True)
    pso2 = models.CharField(max_length=10, blank=True, null=True)

class AuditTrail(models.Model):
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name='auditTrail')
    action = models.CharField(max_length=255)
    userName = models.CharField(max_length=100)
    remarks = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
