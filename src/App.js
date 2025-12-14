import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, X, Check, Search, RefreshCw, LogIn } from 'lucide-react';

const SpaceBookingSystem = () => {
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    turma: '',
    materia: '',
    observacoes: '',
    teacher: 'Você'
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const spaces = [
    { id: 1, name: 'Atelier de Artes', type: 'classroom', capacity: 30, resources: ['Mesas de trabalho', 'Materiais artísticos', 'Pia'] },
    { id: 2, name: 'Auditório B. Norte', type: 'auditorium', capacity: 100, resources: ['Projetor', 'Sistema de som', 'Palco'] },
    { id: 3, name: 'Auditório Bloco Sul', type: 'auditorium', capacity: 120, resources: ['Projetor', 'Sistema de som', 'Palco'] },
    { id: 4, name: 'BS - Chrome A (34un)', type: 'laboratory', capacity: 34, resources: ['34 Chromebooks', 'Projetor', 'Rede Wi-Fi'] },
    { id: 5, name: 'BS - Chrome B (34un)', type: 'laboratory', capacity: 34, resources: ['34 Chromebooks', 'Projetor', 'Rede Wi-Fi'] },
    { id: 6, name: 'BS - Chrome C (34un)', type: 'laboratory', capacity: 34, resources: ['34 Chromebooks', 'Projetor', 'Rede Wi-Fi'] },
    { id: 7, name: 'Conj. Chrome E (8un)', type: 'laboratory', capacity: 8, resources: ['8 Chromebooks', 'Mesa compartilhada'] },
    { id: 8, name: 'Oficina de Invenções', type: 'classroom', capacity: 25, resources: ['Ferramentas', 'Bancadas', 'Materiais maker'] }
  ];

  const timeSlots = [
    '07:30', '08:15', '09:15', '10:00', '11:00', '11:45', 
    '13:15', '14:00', '15:00', '15:45', '16:45', '17:30'
  ];

  const spaceTypes = {
    all: 'Todos',
    laboratory: 'Labs Chromebook',
    classroom: 'Ateliers/Oficinas',
    auditorium: 'Auditórios'
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/calendar?date=${selectedDate}`);
      if (response.ok) {
        const events = await response.json();
        
        const formattedBookings = events.map(event => {
          const startTime = new Date(event.start.dateTime);
          const endTime = new Date(event.end.dateTime);
          const duration = (endTime - startTime) / (1000 * 60 * 60);
          
          return {
            id: event.id,
            space: event.location || event.summary.split(' - ')[0],
            date: selectedDate,
            time: startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            duration: Math.round(duration),
            teacher: event.description?.match(/Professor: (.*)/)?.[1] || 'Desconhecido',
            turma: event.description?.match(/Turma: (.*)/)?.[1] || '',
            materia: event.description?.match(/Matéria: (.*)/)?.[1] || '',
            observacoes: event.description?.match(/Observações: (.*)/)?.[1] || ''
          };
        });
        
        setBookings(formattedBookings);
      }
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadBookings();
    }
  }, [selectedDate, authenticated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('authenticated') === 'true') {
      setAuthenticated(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const filteredSpaces = spaces.filter(space => {
    const matchesType = filterType === 'all' || space.type === filterType;
    const matchesSearch = space.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const isTimeSlotAvailable = (space, date, time) => {
    return !bookings.some(booking => 
      booking.space === space.name && 
      booking.date === date && 
      booking.time === time
    );
  };

  const handleBooking = (space, time) => {
    if (!authenticated) {
      alert('Por favor, faça login com Google primeiro!');
      return;
    }
    setSelectedSpace(space);
    setSelectedTime(time);
    setBookingForm({ turma: '', materia: '', observacoes: '', teacher: 'Você' });
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!bookingForm.turma || !bookingForm.materia) {
      alert('Por favor, preencha turma e matéria');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space: selectedSpace.name,
          date: selectedDate,
          time: selectedTime,
          duration: parseInt(duration),
          ...bookingForm
        })
      });

      if (response.ok) {
        alert('Reserva criada com sucesso!');
        setShowBookingModal(false);
        loadBookings();
      } else {
        alert('Erro ao criar reserva. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      alert('Erro ao criar reserva. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (eventId) => {
    if (!window.confirm('Deseja realmente cancelar esta reserva?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/calendar?eventId=${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Reserva cancelada!');
        loadBookings();
      } else {
        alert('Erro ao cancelar reserva.');
      }
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('Erro ao cancelar reserva.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth';
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="bg-indigo-600 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Sistema de Reservas</h1>
          <p className="text-gray-600 mb-8">Faça login com sua conta Google da escola para acessar o sistema</p>
          <button
            onClick={handleGoogleLogin}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl flex items-center justify-center gap-3 w-full font-semibold text-lg transition-colors"
          >
            <LogIn className="w-6 h-6" />
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-3 rounded-xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Sistema de Reservas</h1>
                <p className="text-gray-600">Integrado com Google Calendar</p>
              </div>
            </div>
            <button
              onClick={loadBookings}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          <div className="flex items-center gap-4">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar espaço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(spaceTypes).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterType === key 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <p className="text-gray-600 mt-4">Carregando...</p>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {filteredSpaces.map(space => (
              <div key={space.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-6 h-6 text-white" />
                      <div>
                        <h3 className="text-xl font-bold text-white">{space.name}</h3>
                        <div className="flex items-center gap-2 text-indigo-100">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">Capacidade: {space.capacity} pessoas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 font-semibold mb-2">Recursos:</p>
                    <div className="flex flex-wrap gap-2">
                      {space.resources.map((resource, idx) => (
                        <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs">
                          {resource}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Horários:</p>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {timeSlots.map(time => {
                        const available = isTimeSlotAvailable(space, selectedDate, time);
                        return (
                          <button
                            key={time}
                            onClick={() => available && handleBooking(space, time)}
                            disabled={!available}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              available
                                ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            Reservas do Dia
          </h2>
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma reserva para este dia</p>
            ) : (
              bookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-lg">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{booking.space}</h4>
                      <p className="text-sm text-gray-600">
                        {booking.time} • {booking.duration}h • {booking.teacher}
                      </p>
                      <p className="text-sm text-indigo-600 font-semibold mt-1">
                        {booking.turma} - {booking.materia}
                      </p>
                      {booking.observacoes && (
                        <p className="text-xs text-gray-500 mt-1">{booking.observacoes}</p>
                      )}
                    </div>
                  </div>
                  {booking.teacher === 'Você' && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Confirmar Reserva</h3>
                <button onClick={() => setShowBookingModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600">Espaço</p>
                  <p className="font-bold text-gray-800">{selectedSpace?.name}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600">Data e Horário</p>
                  <p className="font-bold text-gray-800">
                    {new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duração (horas)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="1">1 hora</option>
                    <option value="2">2 horas</option>
                    <option value="3">3 horas</option>
                    <option value="4">4 horas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Turma *
                  </label>
                  <input
                    type="text"
                    value={bookingForm.turma}
                    onChange={(e) => setBookingForm({...bookingForm, turma: e.target.value})}
                    placeholder="Ex: 9º A, 1º EM, 6º B..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Matéria *
                  </label>
                  <input
                    type="text"
                    value={bookingForm.materia}
                    onChange={(e) => setBookingForm({...bookingForm, materia: e.target.value})}
                    placeholder="Ex: Matemática, Robótica, Artes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={bookingForm.observacoes}
                    onChange={(e) => setBookingForm({...bookingForm, observacoes: e.target.value})}
                    placeholder="Informações adicionais..."
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmBooking}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceBookingSystem;