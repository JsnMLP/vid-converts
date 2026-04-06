import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ReportClient from './ReportClient'

interface Props {
  params: { id: string }
}

export default async function ReportPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !report) notFound()

  return <ReportClient report={report} />
}
