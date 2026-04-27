'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { GeneratedCourse } from '../../lib/api-client';
import { Building2, Users, ArrowRight, Briefcase, Clock, Calendar, MapPin } from 'lucide-react';

type RequestFields = NonNullable<GeneratedCourse['request']>;

interface CohortInfoCardProps {
  request: RequestFields;
}

const DELIVERY_LABEL: Record<string, string> = {
  IN_PERSON: 'In-Person',
  VIRTUAL: 'Virtual',
  HYBRID: 'Hybrid',
};

const FREQUENCY_LABEL: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Bi-Weekly',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-2 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-5">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function CohortInfoCard({ request }: CohortInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-500" />
          Cohort Info
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="divide-y divide-gray-100">
          <Row label="Company" value={
            <span className="font-medium">{request.companyName}
              {request.companyIndustry && (
                <span className="text-gray-500 font-normal"> · {request.companyIndustry}</span>
              )}
            </span>
          } />

          {(request.contactName || request.contactPosition) && (
            <Row label="Contact" value={
              <span>
                {[request.contactName, request.contactPosition].filter(Boolean).join(' · ')}
              </span>
            } />
          )}

          {request.participantCount !== undefined && (
            <Row label="Participants" value={
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                {request.participantCount}
              </span>
            } />
          )}

          {(request.currentLevel && request.targetLevel) && (
            <Row label="CEFR Level" value={
              <span className="flex items-center gap-1 font-medium">
                {request.currentLevel}
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                {request.targetLevel}
              </span>
            } />
          )}

          {request.departments && request.departments.length > 0 && (
            <Row label="Departments" value={
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                {request.departments.join(', ')}
              </span>
            } />
          )}

          {request.deliveryMethod && (
            <Row label="Delivery" value={
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {DELIVERY_LABEL[request.deliveryMethod] ?? request.deliveryMethod}
              </span>
            } />
          )}

          {(request.frequency || request.lessonDuration) && (
            <Row label="Schedule" value={
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {[
                  request.frequency ? FREQUENCY_LABEL[request.frequency] : null,
                  request.lessonDuration ? `${request.lessonDuration} min` : null,
                ].filter(Boolean).join(' · ')}
              </span>
            } />
          )}

          {request.preferredTimes && request.preferredTimes.length > 0 && (
            <Row label="Preferred Times" value={
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                {request.preferredTimes.join(', ')}
              </span>
            } />
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
