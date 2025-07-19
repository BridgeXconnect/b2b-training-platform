'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ClientRequest, apiClient } from '../../lib/api-client';
import { Eye, FileText, Users, Clock, Building } from 'lucide-react';

const getStatusBadge = (status: ClientRequest['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">Pending</Badge>;
    case 'in_progress':
      return <Badge variant="default">In Progress</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    case 'requires_review':
      return <Badge variant="destructive">Requires Review</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function RequestsList() {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getClientRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: ClientRequest) => {
    setSelectedRequest(request);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedRequest(null)}
          >
            ← Back to Requests
          </Button>
          {getStatusBadge(selectedRequest.status)}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedRequest.companyDetails.name}</CardTitle>
            <p className="text-gray-600">
              {selectedRequest.companyDetails.industry} • {selectedRequest.companyDetails.size} employees
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Details */}
            <div>
              <h3 className="font-semibold mb-3">Primary Contact</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Name:</strong> {selectedRequest.companyDetails.primaryContact.name}</p>
                <p><strong>Email:</strong> {selectedRequest.companyDetails.primaryContact.email}</p>
                <p><strong>Position:</strong> {selectedRequest.companyDetails.primaryContact.position}</p>
                {selectedRequest.companyDetails.primaryContact.phone && (
                  <p><strong>Phone:</strong> {selectedRequest.companyDetails.primaryContact.phone}</p>
                )}
              </div>
            </div>

            {/* Training Cohort */}
            <div>
              <h3 className="font-semibold mb-3">Training Cohort</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Participants:</strong> {selectedRequest.trainingCohort.participantCount}</p>
                <p><strong>Current Level:</strong> {selectedRequest.trainingCohort.currentCEFRLevel}</p>
                <p><strong>Target Level:</strong> {selectedRequest.trainingCohort.targetCEFRLevel}</p>
                <p><strong>Roles/Departments:</strong> {selectedRequest.trainingCohort.rolesAndDepartments.join(', ')}</p>
              </div>
            </div>

            {/* Training Objectives */}
            <div>
              <h3 className="font-semibold mb-3">Training Objectives</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Specific Goals:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {selectedRequest.trainingObjectives.specificGoals.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Pain Points:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {selectedRequest.trainingObjectives.painPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Success Criteria:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {selectedRequest.trainingObjectives.successCriteria.map((criteria, index) => (
                      <li key={index}>{criteria}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Course Preferences */}
            <div>
              <h3 className="font-semibold mb-3">Course Preferences</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Total Length:</strong> {selectedRequest.coursePreferences.totalLength} hours</p>
                <p><strong>Lessons per Module:</strong> {selectedRequest.coursePreferences.lessonsPerModule}</p>
                <p><strong>Delivery Method:</strong> {selectedRequest.coursePreferences.deliveryMethod}</p>
                <p><strong>Frequency:</strong> {selectedRequest.coursePreferences.scheduling.frequency}</p>
                <p><strong>Lesson Duration:</strong> {selectedRequest.coursePreferences.scheduling.duration} minutes</p>
                <p><strong>Preferred Times:</strong> {selectedRequest.coursePreferences.scheduling.preferredTimes.join(', ')}</p>
              </div>
            </div>

            {/* SOP Documents */}
            <div>
              <h3 className="font-semibold mb-3">SOP Documents</h3>
              {selectedRequest.sopDocuments.length > 0 ? (
                <div className="space-y-2">
                  {selectedRequest.sopDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{doc.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {doc.processed ? 'Processed' : 'Processing...'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={doc.processed ? 'secondary' : 'outline'}>
                        {doc.processed ? 'Ready' : 'Processing'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No SOP documents uploaded</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button>Generate Course</Button>
              <Button variant="outline">Edit Request</Button>
              <Button variant="outline">Contact Client</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Client Requests</h2>
        <Button onClick={loadRequests}>Refresh</Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No client requests</h3>
            <p className="text-gray-500">Create your first client request to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-semibold">{request.companyDetails.name}</h3>
                      <p className="text-sm text-gray-600">{request.companyDetails.industry}</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{request.trainingCohort.participantCount} participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{request.coursePreferences.totalLength}h course</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Level: </span>
                    {request.trainingCohort.currentCEFRLevel} → {request.trainingCohort.targetCEFRLevel}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">SOPs: </span>
                    {request.sopDocuments.length} files
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Contact: {request.companyDetails.primaryContact.name}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRequest(request)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}