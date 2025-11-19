import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, Plus, X, Calendar, Trash2 } from 'lucide-react';

export default function TimeboxingApp() {
  const [topPriorities, setTopPriorities] = useState(['', '', '']);
  const [brainDump, setBrainDump] = useState(['']);
  const [timeBlocks, setTimeBlocks] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Estados para el drag personalizado
  const [dragState, setDragState] = useState({
    isDragging: false,
    dragData: null,
    ghostElement: null,
    initialX: 0,
    initialY: 0,
    currentX: 0,
    currentY: 0
  });

  const dragGhostRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);

  const currentDate = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });

  const hours = Array.from({ length: 19 }, (_, i) => i + 5);

  // Cargar datos del localStorage
  useEffect(() => {
    try {
      const savedPriorities = localStorage.getItem('myTimeboxing_topPriorities');
      const savedBrainDump = localStorage.getItem('myTimeboxing_brainDump');
      const savedTimeBlocks = localStorage.getItem('myTimeboxing_timeBlocks');

      if (savedPriorities) setTopPriorities(JSON.parse(savedPriorities));
      if (savedBrainDump) setBrainDump(JSON.parse(savedBrainDump));
      if (savedTimeBlocks) setTimeBlocks(JSON.parse(savedTimeBlocks));
      
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setIsLoaded(true);
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('myTimeboxing_topPriorities', JSON.stringify(topPriorities));
      } catch (error) {
        console.error('Error saving topPriorities:', error);
      }
    }
  }, [topPriorities, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('myTimeboxing_brainDump', JSON.stringify(brainDump));
      } catch (error) {
        console.error('Error saving brainDump:', error);
      }
    }
  }, [brainDump, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('myTimeboxing_timeBlocks', JSON.stringify(timeBlocks));
      } catch (error) {
        console.error('Error saving timeBlocks:', error);
      }
    }
  }, [timeBlocks, isLoaded]);

  // Auto-scroll cuando el cursor está cerca de los bordes
  const handleAutoScroll = (clientY) => {
    const scrollThreshold = 100;
    const scrollSpeed = 15;
    const viewportHeight = window.innerHeight;

    if (clientY < scrollThreshold) {
      // Scroll hacia arriba
      window.scrollBy(0, -scrollSpeed);
    } else if (clientY > viewportHeight - scrollThreshold) {
      // Scroll hacia abajo
      window.scrollBy(0, scrollSpeed);
    }
  };

  // Manejar drop en schedule
  const handleDropOnSchedule = useCallback((hour, half) => {
    if (!dragState.dragData) return;

    const key = `${hour}-${half}`;
    const { text, source, fromKey, fromIndex } = dragState.dragData;
    
    const newBlocks = { ...timeBlocks };

    // Si viene de otro bloque del schedule, eliminarlo del origen
    if (fromKey && fromIndex !== null && source === 'schedule') {
      if (newBlocks[fromKey]) {
        newBlocks[fromKey] = newBlocks[fromKey].filter((_, i) => i !== fromIndex);
        if (newBlocks[fromKey].length === 0) {
          delete newBlocks[fromKey];
        }
      }
    }

    // Agregar al nuevo bloque
    const currentItems = newBlocks[key] || [];
    newBlocks[key] = [...currentItems, { text, completed: false }];
    
    setTimeBlocks(newBlocks);
  }, [dragState.dragData, timeBlocks]);

  // Manejar reordenamiento dentro del mismo bloque del schedule
  const handleDropOnScheduleTask = useCallback((targetKey, targetIndex) => {
    if (!dragState.dragData) return;

    const { source, fromKey, fromIndex, text } = dragState.dragData;

    // Solo reordenar si viene del mismo bloque
    if (source === 'schedule' && fromKey === targetKey && fromIndex !== null && fromIndex !== targetIndex) {
      const newBlocks = { ...timeBlocks };
      const items = [...newBlocks[targetKey]];
      
      // Remover del índice original
      const [movedItem] = items.splice(fromIndex, 1);
      
      // Insertar en el nuevo índice
      items.splice(targetIndex, 0, movedItem);
      
      newBlocks[targetKey] = items;
      setTimeBlocks(newBlocks);
    }
  }, [dragState.dragData, timeBlocks]);

  // Manejar drop en priority
  const handleDropOnPriority = useCallback((targetIndex) => {
    if (!dragState.dragData) return;

    const { source, fromIndex, text } = dragState.dragData;

    if (source === 'priority' && fromIndex !== null && fromIndex !== targetIndex) {
      // Intercambiar tareas dentro de Top Priorities
      const newPriorities = [...topPriorities];
      const sourceText = newPriorities[fromIndex];
      const targetText = newPriorities[targetIndex];
      
      newPriorities[fromIndex] = targetText;
      newPriorities[targetIndex] = sourceText;
      
      setTopPriorities(newPriorities);
    } else if (source === 'dump' && fromIndex !== null) {
      // Mover desde Brain Dump a Top Priorities
      const newPriorities = [...topPriorities];
      const newBrainDump = [...brainDump];
      
      // Guardar lo que había en el destino
      const oldPriority = newPriorities[targetIndex];
      
      // Mover la tarea de Brain Dump a Top Priorities
      newPriorities[targetIndex] = text;
      
      // Eliminar de Brain Dump
      newBrainDump.splice(fromIndex, 1);
      
      // Si Brain Dump queda vacío, agregar una línea vacía
      if (newBrainDump.length === 0) {
        newBrainDump.push('');
      }
      
      // Si había algo en Top Priorities, moverlo a Brain Dump
      if (oldPriority.trim()) {
        // Buscar la primera posición vacía o agregarlo al final
        const emptyIndex = newBrainDump.findIndex(item => !item.trim());
        if (emptyIndex !== -1) {
          newBrainDump[emptyIndex] = oldPriority;
        } else {
          newBrainDump.push(oldPriority);
        }
      }
      
      setTopPriorities(newPriorities);
      setBrainDump(newBrainDump);
    }
  }, [dragState.dragData, topPriorities, brainDump]);

  // Manejar drop en Brain Dump
  const handleDropOnBrainDump = useCallback(() => {
    if (!dragState.dragData) return;

    const { source, fromIndex, text } = dragState.dragData;

    if (source === 'priority' && fromIndex !== null && text.trim()) {
      // Mover desde Top Priorities a Brain Dump
      const newPriorities = [...topPriorities];
      const newBrainDump = [...brainDump];
      
      // Limpiar la prioridad de origen
      newPriorities[fromIndex] = '';
      
      // Agregar a Brain Dump (buscar primera posición vacía o agregar al final)
      const emptyIndex = newBrainDump.findIndex(item => !item.trim());
      if (emptyIndex !== -1) {
        newBrainDump[emptyIndex] = text;
      } else {
        newBrainDump.push(text);
      }
      
      setTopPriorities(newPriorities);
      setBrainDump(newBrainDump);
    }
  }, [dragState.dragData, topPriorities, brainDump]);

  // Iniciar drag
  const handleDragStart = (e, text, source, fromKey = null, fromIndex = null) => {
    if (!text || !text.trim()) return;

    // Crear elemento fantasma (ghost)
    const ghost = document.createElement('div');
    ghost.textContent = text;
    ghost.style.position = 'fixed';
    ghost.style.padding = '8px 12px';
    ghost.style.background = 'white';
    ghost.style.border = '2px solid #4F46E5';
    ghost.style.borderRadius = '8px';
    ghost.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    ghost.style.zIndex = '9999';
    ghost.style.pointerEvents = 'none';
    ghost.style.maxWidth = '300px';
    ghost.style.fontSize = '14px';
    ghost.style.fontWeight = '500';
    ghost.style.cursor = 'grabbing';
    ghost.style.opacity = '0.95';
    
    // Posicionar el ghost en la posición del cursor
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    ghost.style.left = `${clientX + 10}px`;
    ghost.style.top = `${clientY + 10}px`;
    
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;

    setDragState({
      isDragging: true,
      dragData: { text, source, fromKey, fromIndex },
      ghostElement: ghost,
      initialX: clientX,
      initialY: clientY,
      currentX: clientX,
      currentY: clientY
    });

    // Iniciar auto-scroll
    autoScrollIntervalRef.current = setInterval(() => {
      if (dragState.isDragging) {
        handleAutoScroll(dragState.currentY);
      }
    }, 50);
  };

  // Mover durante el drag (memoizado)
  const handleDragMove = useCallback((e) => {
    if (!dragState.isDragging || !dragGhostRef.current) return;

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    // Actualizar posición del ghost
    dragGhostRef.current.style.left = `${clientX + 10}px`;
    dragGhostRef.current.style.top = `${clientY + 10}px`;

    // Actualizar estado para auto-scroll
    setDragState(prev => ({
      ...prev,
      currentX: clientX,
      currentY: clientY
    }));

    handleAutoScroll(clientY);
  }, [dragState.isDragging]);

  // Finalizar drag (memoizado)
  const handleDragEnd = useCallback((e) => {
    if (!dragState.isDragging) return;

    // Limpiar ghost
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }

    // Limpiar auto-scroll
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    // Encontrar el elemento en la posición del drop
    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
    const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
    
    const elementBelow = document.elementFromPoint(clientX, clientY);
    
    if (elementBelow) {
      // Buscar el drop zone más cercano
      const scheduleTask = elementBelow.closest('[data-schedule-task]');
      const dropZone = elementBelow.closest('[data-drop-zone]');
      const priorityZone = elementBelow.closest('[data-priority-zone]');
      const brainDumpZone = elementBelow.closest('[data-braindump-zone]');
      
      if (scheduleTask) {
        const taskKey = scheduleTask.dataset.taskKey;
        const taskIndex = parseInt(scheduleTask.dataset.taskIndex);
        handleDropOnScheduleTask(taskKey, taskIndex);
      } else if (dropZone) {
        const hour = dropZone.dataset.hour;
        const half = dropZone.dataset.half;
        handleDropOnSchedule(hour, half);
      } else if (priorityZone) {
        const targetIndex = parseInt(priorityZone.dataset.priorityIndex);
        handleDropOnPriority(targetIndex);
      } else if (brainDumpZone) {
        handleDropOnBrainDump();
      }
    }

    // Reset drag state
    setDragState({
      isDragging: false,
      dragData: null,
      ghostElement: null,
      initialX: 0,
      initialY: 0,
      currentX: 0,
      currentY: 0
    });
  }, [dragState.isDragging, handleDropOnSchedule, handleDropOnScheduleTask, handleDropOnPriority, handleDropOnBrainDump]);

  // Limpiar eventos al desmontar
  useEffect(() => {
    return () => {
      if (dragGhostRef.current) {
        dragGhostRef.current.remove();
      }
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, []);

  const handlePriorityChange = (index, value) => {
    const newPriorities = [...topPriorities];
    newPriorities[index] = value;
    setTopPriorities(newPriorities);
  };

  const handlePriorityKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index < topPriorities.length - 1) {
        document.getElementById(`priority-${index + 1}`)?.focus();
      }
    }
  };

  const handleBrainDumpChange = (index, value) => {
    const newDump = [...brainDump];
    newDump[index] = value;
    
    // Si estamos escribiendo en la última línea y no está vacía, agregar una nueva línea
    if (index === newDump.length - 1 && value.trim() !== '') {
      newDump.push('');
    }
    
    setBrainDump(newDump);
  };

  const handleBrainDumpKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Si ya hay una línea vacía al final, moverse a ella
      if (brainDump[brainDump.length - 1].trim() === '') {
        document.getElementById(`braindump-${brainDump.length - 1}`)?.focus();
      } else {
        // Si no hay línea vacía, crear una nueva
        const newDump = [...brainDump];
        newDump.push('');
        setBrainDump(newDump);
        setTimeout(() => {
          document.getElementById(`braindump-${newDump.length - 1}`)?.focus();
        }, 0);
      }
    }
  };

  const addBrainDumpItem = () => {
    // Solo agregar si la última línea no está vacía
    if (brainDump[brainDump.length - 1].trim() !== '') {
      setBrainDump([...brainDump, '']);
    }
  };

  const removeBrainDumpItem = (index) => {
    const newDump = brainDump.filter((_, i) => i !== index);
    
    // Asegurar que siempre haya al menos una línea vacía
    if (newDump.length === 0 || newDump[newDump.length - 1].trim() !== '') {
      newDump.push('');
    }
    
    setBrainDump(newDump);
  };

  const removeTimeBlock = (key, itemIndex) => {
    const newBlocks = { ...timeBlocks };
    if (newBlocks[key]) {
      newBlocks[key] = newBlocks[key].filter((_, i) => i !== itemIndex);
      if (newBlocks[key].length === 0) {
        delete newBlocks[key];
      }
    }
    setTimeBlocks(newBlocks);
  };

  const toggleTaskComplete = (key, itemIndex) => {
    const newBlocks = { ...timeBlocks };
    if (newBlocks[key] && newBlocks[key][itemIndex]) {
      newBlocks[key][itemIndex] = {
        ...newBlocks[key][itemIndex],
        completed: !newBlocks[key][itemIndex].completed
      };
      setTimeBlocks(newBlocks);
    }
  };

  const clearAllTasks = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todas las tareas? Esta acción no se puede deshacer.')) {
      setTopPriorities(['', '', '']);
      setBrainDump(['']);
      setTimeBlocks({});
      localStorage.removeItem('myTimeboxing_topPriorities');
      localStorage.removeItem('myTimeboxing_brainDump');
      localStorage.removeItem('myTimeboxing_timeBlocks');
    }
  };

  const formatHour = (hour) => {
    if (hour === 12) return '12:00 PM';
    if (hour > 12) return `${hour - 12}:00 PM`;
    return `${hour}:00 AM`;
  };

  // Agregar listeners globales para drag y prevención de selección
  useEffect(() => {
    if (dragState.isDragging) {
      // Prevenir selección de texto durante drag
      const preventSelection = (e) => {
        e.preventDefault();
      };

      // Aplicar user-select: none al body
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.msUserSelect = 'none';
      document.body.style.mozUserSelect = 'none';

      // Bloquear eventos de selección
      document.addEventListener('selectstart', preventSelection);
      document.addEventListener('mousedown', preventSelection);
      
      // Listeners de movimiento
      window.addEventListener('pointermove', handleDragMove);
      window.addEventListener('pointerup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        // Restaurar selección de texto
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.style.msUserSelect = '';
        document.body.style.mozUserSelect = '';

        // Remover bloqueadores de selección
        document.removeEventListener('selectstart', preventSelection);
        document.removeEventListener('mousedown', preventSelection);
        
        // Remover listeners de movimiento
        window.removeEventListener('pointermove', handleDragMove);
        window.removeEventListener('pointerup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border-4 border-indigo-600 flex items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-indigo-600 rotate-45"></div>
                  <div className="w-full h-0.5 bg-indigo-600 -rotate-45 absolute"></div>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-indigo-900">My Timeboxing</h1>
            </div>
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <div className="px-4 py-2 bg-indigo-50 border-2 border-indigo-300 rounded-lg font-semibold text-indigo-900">
                {currentDate}
              </div>
              <button
                onClick={clearAllTasks}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 font-semibold shadow-md"
                title="Borrar todas las tareas"
              >
                <Trash2 className="w-5 h-5" />
                Limpiar Todo
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-indigo-900 mb-4 border-b-2 border-indigo-200 pb-2">
                Top Priorities
              </h2>
              <div className="space-y-3">
                {topPriorities.map((priority, index) => (
                  <div
                    key={index}
                    data-priority-zone
                    data-priority-index={index}
                    className="relative"
                  >
                    <div className="flex items-center gap-2">
                      {priority.trim() && (
                        <div
                          onPointerDown={(e) => handleDragStart(e, priority, 'priority', null, index)}
                          onTouchStart={(e) => handleDragStart(e, priority, 'priority', null, index)}
                          className="cursor-grab active:cursor-grabbing touch-none"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <input
                        id={`priority-${index}`}
                        type="text"
                        value={priority}
                        onChange={(e) => handlePriorityChange(index, e.target.value)}
                        onKeyDown={(e) => handlePriorityKeyDown(e, index)}
                        placeholder={`Priority ${index + 1}`}
                        className="flex-1 px-4 py-3 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4 border-b-2 border-indigo-200 pb-2">
                <h2 className="text-2xl font-bold text-indigo-900">Brain Dump</h2>
                <button
                  onClick={addBrainDumpItem}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div 
                className="space-y-2 max-h-96 overflow-y-auto"
                data-braindump-zone
              >
                {brainDump.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {item.trim() && (
                      <div
                        onPointerDown={(e) => handleDragStart(e, item, 'dump', null, index)}
                        onTouchStart={(e) => handleDragStart(e, item, 'dump', null, index)}
                        className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <input
                      id={`braindump-${index}`}
                      type="text"
                      value={item}
                      onChange={(e) => handleBrainDumpChange(index, e.target.value)}
                      onKeyDown={(e) => handleBrainDumpKeyDown(e, index)}
                      placeholder="Add a task..."
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                    {brainDump.length > 1 && item.trim() !== '' && (
                      <button
                        onClick={() => removeBrainDumpItem(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4 border-b-2 border-indigo-200 pb-2">
              Schedule
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {hours.map((hour) => (
                <React.Fragment key={hour}>
                  <div
                    data-drop-zone
                    data-hour={hour}
                    data-half="00"
                    className={`border-2 border-dashed rounded-lg p-3 min-h-24 transition-colors ${
                      timeBlocks[`${hour}-00`]
                        ? 'bg-indigo-50 border-indigo-400'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                    }`}
                  >
                    <div className="text-sm font-bold text-indigo-600 mb-2">
                      {formatHour(hour)}
                    </div>
                    {timeBlocks[`${hour}-00`] && (
                      <div className="space-y-2">
                        {timeBlocks[`${hour}-00`].map((task, idx) => (
                          <div
                            key={idx}
                            data-schedule-task
                            data-task-key={`${hour}-00`}
                            data-task-index={idx}
                            className={`relative border-2 rounded p-2 shadow-sm transition-all ${
                              task.completed
                                ? 'bg-gray-100 border-gray-300 opacity-60'
                                : 'bg-white border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center gap-1 absolute -top-2 -right-2">
                              <button
                                onClick={() => removeTimeBlock(`${hour}-00`, idx)}
                                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                onPointerDown={(e) => handleDragStart(e, task.text, 'schedule', `${hour}-00`, idx)}
                                onTouchStart={(e) => handleDragStart(e, task.text, 'schedule', `${hour}-00`, idx)}
                                className="cursor-grab active:cursor-grabbing touch-none"
                              >
                                <GripVertical className="w-3 h-3 text-gray-400" />
                              </div>
                              <div
                                onClick={() => toggleTaskComplete(`${hour}-00`, idx)}
                                className={`text-sm font-medium flex-1 cursor-pointer select-none ${
                                  task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                                }`}
                              >
                                {task.text}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    data-drop-zone
                    data-hour={hour}
                    data-half="30"
                    className={`border-2 border-dashed rounded-lg p-3 min-h-24 transition-colors ${
                      timeBlocks[`${hour}-30`]
                        ? 'bg-indigo-50 border-indigo-400'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                    }`}
                  >
                    <div className="text-sm font-bold text-indigo-600 mb-2">
                      {hour === 12 ? '12:30 PM' : hour > 12 ? `${hour - 12}:30 PM` : `${hour}:30 AM`}
                    </div>
                    {timeBlocks[`${hour}-30`] && (
                      <div className="space-y-2">
                        {timeBlocks[`${hour}-30`].map((task, idx) => (
                          <div
                            key={idx}
                            data-schedule-task
                            data-task-key={`${hour}-30`}
                            data-task-index={idx}
                            className={`relative border-2 rounded p-2 shadow-sm transition-all ${
                              task.completed
                                ? 'bg-gray-100 border-gray-300 opacity-60'
                                : 'bg-white border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center gap-1 absolute -top-2 -right-2">
                              <button
                                onClick={() => removeTimeBlock(`${hour}-30`, idx)}
                                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                onPointerDown={(e) => handleDragStart(e, task.text, 'schedule', `${hour}-30`, idx)}
                                onTouchStart={(e) => handleDragStart(e, task.text, 'schedule', `${hour}-30`, idx)}
                                className="cursor-grab active:cursor-grabbing touch-none"
                              >
                                <GripVertical className="w-3 h-3 text-gray-400" />
                              </div>
                              <div
                                onClick={() => toggleTaskComplete(`${hour}-30`, idx)}
                                className={`text-sm font-medium flex-1 cursor-pointer select-none ${
                                  task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                                }`}
                              >
                                {task.text}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}