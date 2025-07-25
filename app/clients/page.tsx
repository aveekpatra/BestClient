'use client'

import { useState } from 'react'
import AppLayout from '../../components/AppLayout'
import { ClientList } from '../../components/ClientList'
import { ClientFormModal } from '../../components/ClientFormModal'
import { ClientDetails } from '../../components/ClientDetails'
import { Id } from '../../convex/_generated/dataModel'

type View = 'list' | 'details'

export default function ClientsPage() {
  const [currentView, setCurrentView] = useState<View>('list')
  const [selectedClientId, setSelectedClientId] = useState<Id<"clients"> | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingClientId, setEditingClientId] = useState<Id<"clients"> | undefined>(undefined)

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId as Id<"clients">)
    setCurrentView('details')
  }

  const handleClientEdit = (clientId: string) => {
    setEditingClientId(clientId as Id<"clients">)
    setIsFormModalOpen(true)
  }

  const handleClientCreate = () => {
    setEditingClientId(undefined)
    setIsFormModalOpen(true)
  }

  const handleFormSuccess = (clientId: Id<"clients">) => {
    setSelectedClientId(clientId)
    setCurrentView('details')
    setIsFormModalOpen(false)
  }

  const handleDetailsEdit = () => {
    setEditingClientId(selectedClientId!)
    setIsFormModalOpen(true)
  }

  const handleDetailsDelete = () => {
    setCurrentView('list')
    setSelectedClientId(null)
  }

  const handleDetailsClose = () => {
    setCurrentView('list')
    setSelectedClientId(null)
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

      {currentView === 'details' && selectedClientId && (
        <ClientDetails
          clientId={selectedClientId}
          onEdit={handleDetailsEdit}
          onDelete={handleDetailsDelete}
          onClose={handleDetailsClose}
        />
      )}

      <ClientFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        clientId={editingClientId}
        onSuccess={handleFormSuccess}
      />
    </AppLayout>
  )
}