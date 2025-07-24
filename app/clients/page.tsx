'use client'

import { useState } from 'react'
import AppLayout from '../../components/AppLayout'
import { ClientList } from '../../components/ClientList'
import { ClientForm } from '../../components/ClientForm'
import { ClientDetails } from '../../components/ClientDetails'
import { Id } from '../../convex/_generated/dataModel'

type View = 'list' | 'create' | 'edit' | 'details'

export default function ClientsPage() {
  const [currentView, setCurrentView] = useState<View>('list')
  const [selectedClientId, setSelectedClientId] = useState<Id<"clients"> | null>(null)

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId as Id<"clients">)
    setCurrentView('details')
  }

  const handleClientEdit = (clientId: string) => {
    setSelectedClientId(clientId as Id<"clients">)
    setCurrentView('edit')
  }

  const handleClientCreate = () => {
    setSelectedClientId(null)
    setCurrentView('create')
  }

  const handleFormSave = (clientId: Id<"clients">) => {
    setSelectedClientId(clientId)
    setCurrentView('details')
  }

  const handleFormCancel = () => {
    setCurrentView('list')
  }

  const handleDetailsEdit = () => {
    setCurrentView('edit')
  }

  const handleDetailsDelete = () => {
    setCurrentView('list')
  }

  const handleDetailsClose = () => {
    setCurrentView('list')
  }

  return (
    <AppLayout>
      {currentView === 'list' && (
        <ClientList
          onClientSelect={handleClientSelect}
          onClientEdit={handleClientEdit}
          onClientCreate={handleClientCreate}
        />
      )}

      {(currentView === 'create' || currentView === 'edit') && (
        <ClientForm
          clientId={currentView === 'edit' ? selectedClientId! : undefined}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {currentView === 'details' && selectedClientId && (
        <ClientDetails
          clientId={selectedClientId}
          onEdit={handleDetailsEdit}
          onDelete={handleDetailsDelete}
          onClose={handleDetailsClose}
        />
      )}
    </AppLayout>
  )
}