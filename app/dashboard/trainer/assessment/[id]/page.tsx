'use client';

import FormRenderer from '@/components/form-renderer';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormTemplate } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function TakeAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        const id = params.id as string;
        const found = (data.templates || []).find((t: FormTemplate) => t.id === id);
        if (!found) {
          router.push('/dashboard/trainer/new-assessment');
          return;
        }
        setTemplate(found);
      } catch (e) {
        console.error('Failed to load template', e);
        router.push('/dashboard/trainer/new-assessment');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [params.id, router]);

  const handleComplete = async (submission: any) => {
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      // Navigation is handled by the Thank You screen inside FormRenderer
    } catch (e) {
      console.error('Failed to submit assessment', e);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen text-[#141414]/40 text-sm">Loading assessment...</div>;
  if (!template || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#E4E3E0] overflow-y-auto py-12 px-4">
      <FormRenderer
        template={template}
        user={user}
        onComplete={handleComplete}
        onCancel={() => router.push('/dashboard/trainer/new-assessment')}
      />
    </div>
  );
}
