'use client';

import FormEditor from '@/components/form-editor';
import { store } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function NewFormPage() {
  const router = useRouter();

  const handleSave = (template: any) => {
    store.addTemplate(template);
    router.push('/dashboard/admin/builder');
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
