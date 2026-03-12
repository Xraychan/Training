'use client';

import FormRenderer from '@/components/form-renderer';
import { store } from '@/lib/store';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormTemplate } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function TakeAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [template] = useState<FormTemplate | null>(() => {
    const id = params.id as string;
    return store.getTemplates().find(t => t.id === id) || null;
  });

  useEffect(() => {
    if (!template) {
      router.push('/dashboard/staff/new-assessment');
    }
  }, [template, router]);

  const handleComplete = (submission: any) => {
    store.addSubmission(submission);
    router.push('/dashboard/staff/my-forms');
  };

  if (!template || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#E4E3E0] overflow-y-auto py-12 px-4">
      <FormRenderer 
        template={template}
        user={user}
        onComplete={handleComplete}
        onCancel={() => router.push('/dashboard/staff/new-assessment')}
      />
    </div>
  );
}
