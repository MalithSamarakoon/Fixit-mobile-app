import { auth, db } from '../../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';

const getAgencyId = () => {
  const agencyId = auth.currentUser?.uid;
  if (!agencyId) {
    throw new Error('No logged-in agency user found.');
  }
  return agencyId;
};

const getAgencyUsersQuery = () => {
  const agencyId = getAgencyId();
  return query(
    collection(db, 'users'),
    where('role', '==', 'worker'),
    where('agencyId', '==', agencyId)
  );
};

const getAgencyBookingsQuery = (status) => {
  const agencyId = getAgencyId();
  const baseQuery = query(
    collection(db, 'bookings'),
    where('agencyId', '==', agencyId)
  );

  if (!status) return baseQuery;

  const pendingStatuses = ['Request Sent', 'Pending'];
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === 'pending') {
    return query(
      collection(db, 'bookings'),
      where('agencyId', '==', agencyId),
      where('status', 'in', pendingStatuses)
    );
  }

  return query(
    collection(db, 'bookings'),
    where('agencyId', '==', agencyId),
    where('status', '==', status)
  );
};

const ACTIVE_BOOKING_STATUSES = ['Assigned', 'In Progress'];

export const timeToMinutes = (time) => {
  if (!time) return null;

  const match = String(time).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes > 59) return null;
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const getActiveAgencyBookings = async () => {
  const agencyId = getAgencyId();
  const q = query(
    collection(db, 'bookings'),
    where('agencyId', '==', agencyId),
    where('status', 'in', ACTIVE_BOOKING_STATUSES)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getWorkerBookings = async (workerId) => {
  try {
    const agencyId = getAgencyId();
    const q = query(
      collection(db, 'bookings'),
      where('agencyId', '==', agencyId),
      where('assignedWorkerId', '==', workerId),
      where('status', 'in', ACTIVE_BOOKING_STATUSES)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    throw new Error(`Failed to load worker bookings: ${error.message}`);
  }
};

export const isWorkerBusy = async (workerId, date, time, excludeBookingId) => {
  const requestedMinutes = timeToMinutes(time);
  if (!workerId || !date || requestedMinutes === null) return false;

  const bookings = await getWorkerBookings(workerId);
  return bookings.some((booking) => {
    if (excludeBookingId && booking.id === excludeBookingId) return false;
    if (booking.preferredDate !== date) return false;

    const bookingMinutes = timeToMinutes(booking.preferredTime);
    return bookingMinutes !== null && Math.abs(bookingMinutes - requestedMinutes) <= 120;
  });
};

export const getBusyWorkerIds = async (date, time) => {
  const requestedMinutes = timeToMinutes(time);
  if (!date || requestedMinutes === null) return new Set();

  const bookings = await getActiveAgencyBookings();
  return new Set(
    bookings
      .filter((booking) => {
        if (booking.preferredDate !== date) return false;
        const bookingMinutes = timeToMinutes(booking.preferredTime);
        return bookingMinutes !== null && Math.abs(bookingMinutes - requestedMinutes) <= 120;
      })
      .map((booking) => booking.assignedWorkerId)
      .filter(Boolean)
  );
};

export const getWorkersBusyToday = async () => {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const bookings = await getActiveAgencyBookings();

  return new Set(
    bookings
      .filter((booking) => booking.preferredDate === todayKey)
      .map((booking) => booking.assignedWorkerId)
      .filter(Boolean)
  );
};

export const getAgencyWorkers = async () => {
  try {
    const q = getAgencyUsersQuery();
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    throw new Error(`Failed to load agency workers: ${error.message}`);
  }
};

export const getWorkerById = async (id) => {
  try {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Worker not found.');
    }

    const data = docSnap.data();
    if (data.role !== 'worker' || data.agencyId !== getAgencyId()) {
      throw new Error('This worker does not belong to the current agency.');
    }

    return { id: docSnap.id, ...data };
  } catch (error) {
    throw new Error(`Failed to load worker: ${error.message}`);
  }
};

export const updateWorker = async (id, data) => {
  try {
    const worker = await getWorkerById(id);
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    return { ...worker, ...data, id };
  } catch (error) {
    throw new Error(`Failed to update worker: ${error.message}`);
  }
};

export const deleteWorker = async (id) => {
  try {
    await getWorkerById(id);
    const docRef = doc(db, 'users', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete worker: ${error.message}`);
  }
};

export const getAgencyBookings = async (status) => {
  try {
    const q = getAgencyBookingsQuery(status);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    throw new Error(`Failed to load agency bookings: ${error.message}`);
  }
};

export const getBookingById = async (id) => {
  try {
    const docRef = doc(db, 'bookings', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Booking not found.');
    }

    const data = docSnap.data();
    if (data.agencyId !== getAgencyId()) {
      throw new Error('This booking does not belong to the current agency.');
    }

    return { id: docSnap.id, ...data };
  } catch (error) {
    throw new Error(`Failed to load booking: ${error.message}`);
  }
};

export const updateBooking = async (id, data) => {
  try {
    await getBookingById(id);
    const docRef = doc(db, 'bookings', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    return { id, ...data };
  } catch (error) {
    throw new Error(`Failed to update booking: ${error.message}`);
  }
};

export const assignWorkerToBooking = async (bookingId, worker) => {
  try {
    const booking = await getBookingById(bookingId);
    const workerData = typeof worker === 'string' ? await getWorkerById(worker) : worker;

    const docRef = doc(db, 'bookings', bookingId);
    await updateDoc(docRef, {
      assignedWorkerId: workerData.id || workerData.uid || worker,
      assignedWorkerName: workerData.fullName || workerData.name || workerData.username || 'Assigned Worker',
      status: 'Assigned',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      ...booking,
      assignedWorkerId: workerData.id || workerData.uid || worker,
      assignedWorkerName: workerData.fullName || workerData.name || workerData.username || 'Assigned Worker',
      status: 'Assigned',
    };
  } catch (error) {
    throw new Error(`Failed to assign worker: ${error.message}`);
  }
};

export const getWorkerJobHistory = async (workerId) => {
  try {
    const agencyId = getAgencyId();
    const q = query(
      collection(db, 'bookings'),
      where('agencyId', '==', agencyId),
      where('assignedWorkerId', '==', workerId),
      where('status', '==', 'Completed')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    throw new Error(`Failed to load worker job history: ${error.message}`);
  }
};

export const getUserById = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('User not found.');
    }

    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    throw new Error(`Failed to load user: ${error.message}`);
  }
};

export const getAgencyProfile = async () => {
  try {
    const agencyId = getAgencyId();
    const docRef = doc(db, 'users', agencyId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Agency profile not found.');
    }

    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    throw new Error(`Failed to load agency profile: ${error.message}`);
  }
};

export const updateAgencyProfile = async (data) => {
  try {
    const agencyId = getAgencyId();
    const docRef = doc(db, 'users', agencyId);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    return { id: agencyId, ...data };
  } catch (error) {
    throw new Error(`Failed to update agency profile: ${error.message}`);
  }
};
