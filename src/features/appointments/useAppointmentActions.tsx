import { useCallback, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useMutation } from '../../hooks/useMutation';
import { appointmentService } from '../../services/appointmentService';
import { getErrorMessage } from '../../services/errors';
import type { AppointmentDetails, ID } from '../../types/domain';
import { RecordPaymentModal } from '../billing/RecordPaymentModal';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { CompleteConsultationModal } from './CompleteConsultationModal';

export type AppointmentAction = 'check_in' | 'start' | 'complete' | 'cancel' | 'record_payment' | 'view';

export type AppointmentActionHandler = (action: AppointmentAction, appointment: AppointmentDetails) => void;

type DialogAction = Extract<AppointmentAction, 'complete' | 'cancel' | 'record_payment' | 'view'>;

interface OpenDialog {
  action: DialogAction;
  appointment: AppointmentDetails;
}

/**
 * One place for every appointment workflow action. Quick transitions (check in,
 * start) run immediately with toast feedback; the rest open the right dialog.
 * Render the returned `dialogs` once wherever the hook is used.
 */
export function useAppointmentActions(): {
  handleAction: AppointmentActionHandler;
  pendingId: ID | null;
  dialogs: ReactNode;
} {
  const toast = useToast();
  const [pendingId, setPendingId] = useState<ID | null>(null);
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const cancelMutation = useMutation(appointmentService.cancel);
  const resetCancel = cancelMutation.reset;

  const close = useCallback(() => setDialog(null), []);

  const runTransition = useCallback(
    async (appointment: AppointmentDetails, transition: (id: ID) => Promise<AppointmentDetails>, success: string) => {
      setPendingId(appointment.id);
      try {
        await transition(appointment.id);
        toast.success(success);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setPendingId(null);
      }
    },
    [toast],
  );

  const handleAction = useCallback<AppointmentActionHandler>(
    (action, appointment) => {
      const name = appointment.patient.name;
      switch (action) {
        case 'check_in':
          void runTransition(appointment, appointmentService.checkIn, `${name} checked in · token #${appointment.token}.`);
          return;
        case 'start':
          void runTransition(appointment, appointmentService.startConsultation, `${name} is now with ${appointment.doctor.name}.`);
          return;
        default:
          resetCancel();
          setDialog({ action, appointment });
      }
    },
    [runTransition, resetCancel],
  );

  const confirmCancel = async (appointment: AppointmentDetails) => {
    const result = await cancelMutation.mutate(appointment.id);
    if (result.ok) {
      toast.success(`Appointment for ${appointment.patient.name} cancelled.`);
      close();
    }
  };

  let dialogs: ReactNode = null;
  if (dialog) {
    const { action, appointment } = dialog;
    switch (action) {
      case 'complete':
        dialogs = <CompleteConsultationModal appointment={appointment} onClose={close} />;
        break;
      case 'record_payment':
        dialogs = <RecordPaymentModal appointment={appointment} onClose={close} />;
        break;
      case 'view':
        dialogs = (
          <AppointmentDetailsModal
            appointmentId={appointment.id}
            onClose={close}
            onRecordPayment={(latest) => setDialog({ action: 'record_payment', appointment: latest })}
          />
        );
        break;
      case 'cancel':
        dialogs = (
          <ConfirmDialog
            title="Cancel appointment?"
            message={`${appointment.patient.name}’s token #${appointment.token} with ${appointment.doctor.name} will be cancelled.`}
            confirmLabel="Cancel appointment"
            tone="danger"
            isPending={cancelMutation.isPending}
            error={cancelMutation.error}
            onConfirm={() => void confirmCancel(appointment)}
            onCancel={close}
          />
        );
        break;
    }
  }

  return { handleAction, pendingId, dialogs };
}
