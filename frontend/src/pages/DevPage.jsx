import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Button from '../components/Button/Button.jsx';
import TextField from '../components/TextField/TextField.jsx';
import TextArea from '../components/TextArea/TextArea.jsx';
import Select from '../components/Select/Select.jsx';
import Modal from '../components/Modal/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog/ConfirmDialog.jsx';
import StatusBadge from '../components/StatusBadge/StatusBadge.jsx';
import EmptyState from '../components/EmptyState/EmptyState.jsx';
import ErrorState from '../components/ErrorState/ErrorState.jsx';
import Spinner from '../components/Spinner/Spinner.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher.jsx';
import DateTime from '../components/DateTime/DateTime.jsx';
import LocationLabel from '../components/LocationLabel/LocationLabel.jsx';
import styles from './DevPage.module.scss';

// sample fixture values used for previewing date and status components
const SAMPLE_DATE = '2026-11-25T13:15:00.000Z';
const ALL_STATUSES = ['CONFIRMED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_LECTURER', 'PENDING', 'SENT', 'FAILED'];

// simulates an async API request that resolves or rejects after 1 second
function fakeRequest(shouldFail) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('fake error'));
        return;
      }
      resolve();
    }, 1000);
  });
}

// developer-only showcase page displaying all shared UI components
export default function DevPage() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [shouldFail, setShouldFail] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [topic, setTopic] = useState('');
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  // reset previous error state and open the confirmation dialog
  function openConfirmDialog() {
    setConfirmError('');
    setIsConfirmOpen(true);
  }

  // run the mock confirmation request and show either an error or a success toast
  async function handleConfirm(reason) {
    setConfirmError('');
    try {
      await fakeRequest(shouldFail);
    } catch (error) {
      setConfirmError(t('errors.INTERNAL_ERROR'));
      // re-throw so the dialog keeps itself open after a failed request
      throw error;
    }
    setIsConfirmOpen(false);
    toast.success(`OK: "${reason}"`);
  }

  // toggle the demo button's loading state during a simulated request
  async function handleLoadingClick() {
    setIsButtonLoading(true);
    await fakeRequest(false);
    setIsButtonLoading(false);
  }

  return (
    <main className="page-container">
      <div className={styles.page}>
        {/* page header with language toggle */}
        <div className={styles.header}>
          <h1>Podgląd komponentów (/dev)</h1>
          <LanguageSwitcher />
        </div>

        {/* button variants and loading state preview */}
        <section className={styles.section}>
          <h2>Button</h2>
          <div className={styles.row}>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
            <Button isLoading={isButtonLoading} onClick={handleLoadingClick}>
              Kliknij — ładowanie 1 s
            </Button>
          </div>
        </section>

        {/* form inputs preview */}
        <section className={styles.section}>
          <h2>TextField, TextArea, Select</h2>
          <div className={styles.grid}>
            <TextField label="Nazwisko prowadzącego" placeholder="np. Kowalski" />
            <TextField label="Pole z błędem" error="To pole jest wymagane" />
            <TextArea
              label="Temat konsultacji"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              maxLength={300}
            />
            <Select label="Długość slotu" defaultValue="15">
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
            </Select>
          </div>
        </section>

        {/* modal and confirmation dialog triggers and instances */}
        <section className={styles.section}>
          <h2>Modal, ConfirmDialog</h2>
          <div className={styles.row}>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Otwórz Modal
            </Button>
            <Button variant="danger" onClick={openConfirmDialog}>
              Otwórz ConfirmDialog (powód min. 10 znaków)
            </Button>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={shouldFail} onChange={(event) => setShouldFail(event.target.checked)} />
              Symuluj błąd serwera
            </label>
          </div>

          <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Przykładowy modal">
            <p>Zamknij przyciskiem ×, klawiszem Esc albo przyciskiem poniżej.</p>
            <div>
              <Button onClick={() => setIsModalOpen(false)}>{t('common.close')}</Button>
            </div>
          </Modal>

          <ConfirmDialog
            open={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            title="Odwołać wszystkie terminy w tym dniu?"
            description="Poniedziałek, 23 listopada 2026"
            confirmLabel="Odwołaj dzień"
            variant="danger"
            reason={{ label: 'Powód', required: true, minLength: 10, maxLength: 500 }}
            onConfirm={handleConfirm}
            error={confirmError}
          />
        </section>

        {/* status badges for all supported states */}
        <section className={styles.section}>
          <h2>StatusBadge</h2>
          <div className={styles.row}>
            {ALL_STATUSES.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </section>

        {/* feedback states preview */}
        <section className={styles.section}>
          <h2>EmptyState, ErrorState, Spinner</h2>
          <div className={styles.grid}>
            <EmptyState
              title="Brak dyżurów w tym tygodniu"
              text="Tekst pomocniczy (opcjonalny)"
              action={<Button>Utwórz dyżur</Button>}
            />
            <ErrorState code="NETWORK_ERROR" onRetry={() => toast('onRetry')} />
          </div>
          <Spinner />
        </section>

        {/* date and time formatting modes preview */}
        <section className={styles.section}>
          <h2>DateTime ({SAMPLE_DATE})</h2>
          <p>
            date: <DateTime iso={SAMPLE_DATE} format="date" />
          </p>
          <p>
            time: <DateTime iso={SAMPLE_DATE} format="time" showLabel />
          </p>
          <p>
            datetime: <DateTime iso={SAMPLE_DATE} showLabel />
          </p>
        </section>

        {/* location rendering modes preview */}
        <section className={styles.section}>
          <h2>LocationLabel</h2>
          <p>
            IN_PERSON: <LocationLabel mode="IN_PERSON" location="Sala 204, budynek C" />
          </p>
          <p>
            ONLINE + link: <LocationLabel mode="ONLINE" location="https://teams.microsoft.com/l/meetup-join/example" />
          </p>
          <p>
            ONLINE bez linku: <LocationLabel mode="ONLINE" location="Microsoft Teams" />
          </p>
        </section>
      </div>
    </main>
  );
}