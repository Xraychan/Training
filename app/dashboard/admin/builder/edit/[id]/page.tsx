'use client';

import FormEditor from '@/components/form-editor';
import { store } from '@/lib/store';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormTemplate } from '@/lib/types';

export default function EditFormPage() {
  const router = useRouter();
  const params = useParams();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch('/api/templates', { credentials: 'include' });
        const data = await res.json();
        const id = params.id as string;
        const found = (data.templates || []).find((t: FormTemplate) => t.id === id);
        if (!found) {
          router.push('/dashboard/admin/builder');
          return;
        }
        setTemplate(found);
      } catch (e) {
        console.error('Failed to load template', e);
        router.push('/dashboard/admin/builder');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [params.id, router]);

  const handleSave = async (updatedTemplate: FormTemplate) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTemplate),
      });
      if (!res.ok) throw new Error('Failed to update template');
      router.push('/dashboard/admin/builder');
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen text-[#141414]/40 text-sm">Loading editor...</div>;
  if (!template) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      <FormEditor 
        initialTemplate={template}
        onSave={handleSave}
        onCancel={() => router.push('/dashboard/admin/builder')}
      />
    </div>
  );
}
