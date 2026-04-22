'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/contexts/AuthContext';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const schema = z.object({
  companyName: z.string().min(1, 'Required'),
  companyIndustry: z.string().min(1, 'Required'),
  companySize: z.coerce.number().int().min(1, 'Must be at least 1'),
  contactName: z.string().min(1, 'Required'),
  contactEmail: z.string().email('Valid email required'),
  contactPhone: z.string().optional(),
  contactPosition: z.string().min(1, 'Required'),
  participantCount: z.coerce.number().int().min(1, 'At least 1 participant'),
  currentLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  departments: z.array(z.string().min(1)).min(1, 'At least one department'),
  goals: z.array(z.string().min(1)).min(1, 'At least one goal'),
  painPoints: z.array(z.string().min(1)).min(1, 'At least one pain point'),
  successCriteria: z.array(z.string().min(1)).min(1, 'At least one criterion'),
  totalHours: z.coerce.number().int().min(1, 'At least 1 hour'),
  lessonsPerModule: z.coerce.number().int().min(1, 'At least 1 lesson'),
  deliveryMethod: z.enum(['IN_PERSON', 'VIRTUAL', 'HYBRID']),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY']),
  lessonDuration: z.coerce.number().int().min(15, 'At least 15 minutes'),
  preferredTimes: z.array(z.string().min(1)).min(1, 'At least one time slot'),
});

type FormData = z.infer<typeof schema>;

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export default function ClientRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companySize: 100,
      participantCount: 15,
      currentLevel: 'B1',
      targetLevel: 'B2',
      departments: [''],
      goals: [''],
      painPoints: [''],
      successCriteria: [''],
      totalHours: 40,
      lessonsPerModule: 4,
      deliveryMethod: 'HYBRID',
      frequency: 'WEEKLY',
      lessonDuration: 90,
      preferredTimes: [''],
    },
  });

  const depts = useFieldArray({ control, name: 'departments' });
  const goals = useFieldArray({ control, name: 'goals' });
  const pains = useFieldArray({ control, name: 'painPoints' });
  const criteria = useFieldArray({ control, name: 'successCriteria' });
  const times = useFieldArray({ control, name: 'preferredTimes' });

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setStatus('submitting');
    try {
      await apiClient.createClientRequest(data);
      setStatus('success');
      reset();
      onSuccess?.();
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* Company */}
      <Card>
        <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company Name" error={errors.companyName?.message}>
              <Input {...register('companyName')} placeholder="Acme Corp" />
            </Field>
            <Field label="Industry" error={errors.companyIndustry?.message}>
              <Input {...register('companyIndustry')} placeholder="Manufacturing, Finance…" />
            </Field>
            <Field label="Company Size (employees)" error={errors.companySize?.message}>
              <Input type="number" {...register('companySize')} />
            </Field>
          </div>
          <div className="border-t pt-4">
            <p className="font-medium mb-3">Primary Contact</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name" error={errors.contactName?.message}>
                <Input {...register('contactName')} placeholder="Jane Smith" />
              </Field>
              <Field label="Email" error={errors.contactEmail?.message}>
                <Input type="email" {...register('contactEmail')} placeholder="jane@company.com" />
              </Field>
              <Field label="Phone (optional)">
                <Input {...register('contactPhone')} placeholder="+1 555 000 0000" />
              </Field>
              <Field label="Position" error={errors.contactPosition?.message}>
                <Input {...register('contactPosition')} placeholder="HR Director" />
              </Field>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cohort */}
      <Card>
        <CardHeader><CardTitle>Training Cohort</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Participants" error={errors.participantCount?.message}>
              <Input type="number" {...register('participantCount')} />
            </Field>
            <Field label="Current CEFR Level">
              <Select {...register('currentLevel')}>
                {CEFR.map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Target CEFR Level">
              <Select {...register('targetLevel')}>
                {CEFR.map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
            </Field>
          </div>
          <DynamicList
            label="Departments / Roles"
            fields={depts.fields}
            register={(i) => register(`departments.${i}`)}
            onAdd={() => depts.append('')}
            onRemove={depts.remove}
            placeholder="Sales Team, Customer Service…"
          />
        </CardContent>
      </Card>

      {/* Objectives */}
      <Card>
        <CardHeader><CardTitle>Training Objectives</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <DynamicList
            label="Specific Goals"
            fields={goals.fields}
            register={(i) => register(`goals.${i}`)}
            onAdd={() => goals.append('')}
            onRemove={goals.remove}
            placeholder="Improve business email writing…"
          />
          <DynamicList
            label="Current Pain Points"
            fields={pains.fields}
            register={(i) => register(`painPoints.${i}`)}
            onAdd={() => pains.append('')}
            onRemove={pains.remove}
            placeholder="Limited technical vocabulary…"
          />
          <DynamicList
            label="Success Criteria"
            fields={criteria.fields}
            register={(i) => register(`successCriteria.${i}`)}
            onAdd={() => criteria.append('')}
            onRemove={criteria.remove}
            placeholder="80% pass rate on end assessment…"
          />
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader><CardTitle>Course Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Total Hours" error={errors.totalHours?.message}>
              <Input type="number" {...register('totalHours')} />
            </Field>
            <Field label="Lessons per Module" error={errors.lessonsPerModule?.message}>
              <Input type="number" {...register('lessonsPerModule')} />
            </Field>
            <Field label="Delivery Method">
              <Select {...register('deliveryMethod')}>
                <option value="IN_PERSON">In-Person</option>
                <option value="VIRTUAL">Virtual</option>
                <option value="HYBRID">Hybrid</option>
              </Select>
            </Field>
            <Field label="Frequency">
              <Select {...register('frequency')}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BI_WEEKLY">Bi-weekly</option>
              </Select>
            </Field>
            <Field label="Lesson Duration (min)" error={errors.lessonDuration?.message}>
              <Input type="number" {...register('lessonDuration')} />
            </Field>
          </div>
          <DynamicList
            label="Preferred Times"
            fields={times.fields}
            register={(i) => register(`preferredTimes.${i}`)}
            onAdd={() => times.append('')}
            onRemove={times.remove}
            placeholder="9:00 AM – 10:30 AM"
          />
        </CardContent>
      </Card>

      {status === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-md">
          <CheckCircle className="h-5 w-5" /> Request created! Redirecting to Manage Requests…
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
          <AlertCircle className="h-5 w-5" /> Failed to submit. Check the backend is running and try again.
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={status === 'submitting'} className="px-8">
          {status === 'submitting' ? 'Submitting…' : 'Create Client Request'}
        </Button>
      </div>
    </form>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select {...props} className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white">
      {children}
    </select>
  );
}

function DynamicList({
  label, fields, register, onAdd, onRemove, placeholder,
}: {
  label: string;
  fields: { id: string }[];
  register: (i: number) => object;
  onAdd: () => void;
  onRemove: (i: number) => void;
  placeholder: string;
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="flex gap-2">
            <Input {...(register(i) as object)} placeholder={placeholder} />
            {fields.length > 1 && (
              <Button type="button" variant="outline" size="sm" onClick={() => onRemove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}
