from django.urls import path
from .views import AdminDashboardAnalyticsView, ExportReportCSVView

urlpatterns = [
    path('dashboard-stats/', AdminDashboardAnalyticsView.as_view(), name='admin-dashboard-stats'),
    path('export-csv/', ExportReportCSVView.as_view(), name='export-csv'),
]
