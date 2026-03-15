'use client';

import FormEditor from '@/components/form-editor';
import { store } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function NewFormPage() {
  const router = useRouter();

  const handleSave = async (template: any) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!res.ok) throw new Error('Failed to save template');
      router.push('/dashboard/admin/builder');
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      <FormEditor 
        onSave={handleSave}
        onCancel={() => router.push('/dashboard/admin/builder')}
      />
    </div>
  );
}
