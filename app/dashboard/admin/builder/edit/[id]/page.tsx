'use client';

import FormEditor from '@/components/form-editor';
import { store } from '@/lib/store';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormTemplate } from '@/lib/types';

export default function EditFormPage() {
  const router = useRouter();
  const params = useParams();
  const [template] = useState<FormTemplate | null>(() => {
    const id = params.id as string;
    return store.getTemplates().find(t => t.id === id) || null;
  });

  useEffect(() => {
    if (!template) {
      router.push('/dashboard/admin/builder');
    }
  }, [template, router]);

  const handleSave = (updatedTemplate: FormTemplate) => {
    store.updateTemplate(updatedTemplate);
    router.push('/dashboard/admin/builder');
  };

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
