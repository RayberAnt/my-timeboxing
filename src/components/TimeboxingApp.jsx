import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, X, Calendar, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

export default function TimeboxingApp() {
  const [topPriorities, setTopPriorities] = useState(['', '', '']);
  const [brainDump, setBrainDump] = useState(['']);
  const [timeBlocks, setTimeBlocks] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const currentDate = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });

  const hours = Array.from({ length: 19 }, (_, i) => i + 5);

  // Cargar datos del localStorage al iniciar (solo una vez)
  useEffect(() => {
    try {
      const savedPriorities = localStorage.getItem('myTimeboxing_topPriorities');
      const savedBrainDump = localStorage.getItem('myTimeboxing_brainDump');
      const savedTimeBlocks = localStorage.getItem('myTimeboxing_timeBlocks');

      if (savedPriorities) {
        setTopPriorities(JSON.parse(savedPriorities));
      }
      if (savedBrainDump) {
        setBrainDump(JSON.parse(savedBrainDump));
      }
      if (savedTimeBlocks) {
        setTimeBlocks(JSON.parse(savedTimeBlocks));
      }
      
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setIsLoaded(true);
    }
  }, []);

  // Guardar en localStorage solo después de cargar los datos iniciales
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
    setBrainDump(newDump);
  };

  const handleBrainDumpKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newDump = [...brainDump];
      newDump.splice(index + 1, 0, '');
      setBrainDump(newDump);
      setTimeout(() => {
        document.getElementById(`braindump-${index + 1}`)?.focus();
      }, 0);
    }
  };

  const addBrainDumpItem = () => {
    setBrainDump([...brainDump, '']);
  };

  const removeBrainDumpItem = (index) => {
    if (brainDump.length > 1) {
      setBrainDump(brainDump.filter((_, i) => i !== index));
    }
  };

  const handleDragStart = (e, text, source, fromKey = null, fromIndex = null) => {
    const dragData = {
      text,
      source,
      fromKey,
      fromIndex
    };
    setDraggedTask(dragData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  };

  const handlePriorityDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    let dragData;
    try {
      dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      dragData = draggedTask;
    }

    if (!dragData) return;

    // Si viene de Top Priorities, intercambiar las tareas
    if (dragData.source === 'priority' && dragData.fromIndex !== null && dragData.fromIndex !== targetIndex) {
      const newPriorities = [...topPriorities];
      const sourceText = newPriorities[dragData.fromIndex];
      const targetText = newPriorities[targetIndex];
      
      newPriorities[dragData.fromIndex] = targetText;
      newPriorities[targetIndex] = sourceText;
      
      setTopPriorities(newPriorities);
    }
    
    setDraggedTask(null);
  };

  const handleDrop = (e, hour, half) => {
    e.preventDefault();
    e.stopPropagation();
    
    const key = `${hour}-${half}`;
    let dragData;
    
    try {
      dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      dragData = draggedTask || { text: e.dataTransfer.getData('text'), source: 'external' };
    }

    if (!dragData.text || !dragData.text.trim()) return;

    const newBlocks = { ...timeBlocks };

    // Si viene de otro bloque del schedule, eliminarlo del origen
    if (dragData.fromKey && dragData.fromIndex !== null) {
      if (newBlocks[dragData.fromKey]) {
        newBlocks[dragData.fromKey] = newBlocks[dragData.fromKey].filter((_, i) => i !== dragData.fromIndex);
        if (newBlocks[dragData.fromKey].length === 0) {
          delete newBlocks[dragData.fromKey];
        }
      }
    }

    // Agregar al nuevo bloque
    const currentItems = newBlocks[key] || [];
    newBlocks[key] = [...currentItems, { text: dragData.text, completed: false }];
    
    setTimeBlocks(newBlocks);
    setDraggedTask(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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

  const moveTaskUp = (key, itemIndex) => {
    if (itemIndex === 0) return;
    const newBlocks = { ...timeBlocks };
    const items = [...newBlocks[key]];
    [items[itemIndex - 1], items[itemIndex]] = [items[itemIndex], items[itemIndex - 1]];
    newBlocks[key] = items;
    setTimeBlocks(newBlocks);
  };

  const moveTaskDown = (key, itemIndex) => {
    const newBlocks = { ...timeBlocks };
    if (itemIndex === newBlocks[key].length - 1) return;
    const items = [...newBlocks[key]];
    [items[itemIndex], items[itemIndex + 1]] = [items[itemIndex + 1], items[itemIndex]];
    newBlocks[key] = items;
    setTimeBlocks(newBlocks);
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
                    draggable={priority.trim() !== ''}
                    onDragStart={(e) => handleDragStart(e, priority, 'priority', null, index)}
                    onDrop={(e) => handlePriorityDrop(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    className="relative"
                  >
                    <div className="flex items-center gap-2">
                      {priority.trim() && (
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
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
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {brainDump.map((item, index) => (
                  <div
                    key={index}
                    draggable={item.trim() !== ''}
                    onDragStart={(e) => handleDragStart(e, item, 'dump')}
                    className="flex items-center gap-2"
                  >
                    {item.trim() && (
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move flex-shrink-0" />
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
                    {brainDump.length > 1 && (
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
                    onDrop={(e) => handleDrop(e, hour, '00')}
                    onDragOver={handleDragOver}
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
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.text, 'schedule', `${hour}-00`, idx)}
                            className={`relative border-2 rounded p-2 shadow-sm cursor-move transition-all ${
                              task.completed
                                ? 'bg-gray-100 border-gray-300 opacity-60'
                                : 'bg-white border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center gap-1 absolute -top-2 -right-2">
                              {timeBlocks[`${hour}-00`].length > 1 && (
                                <>
                                  {idx > 0 && (
                                    <button
                                      onClick={() => moveTaskUp(`${hour}-00`, idx)}
                                      className="p-0.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 z-10"
                                      title="Mover arriba"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                  )}
                                  {idx < timeBlocks[`${hour}-00`].length - 1 && (
                                    <button
                                      onClick={() => moveTaskDown(`${hour}-00`, idx)}
                                      className="p-0.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 z-10"
                                      title="Mover abajo"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => removeTimeBlock(`${hour}-00`, idx)}
                                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                                title="Eliminar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div
                              onClick={() => toggleTaskComplete(`${hour}-00`, idx)}
                              className={`text-sm font-medium pr-16 cursor-pointer select-none ${
                                task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                              }`}
                            >
                              <GripVertical className="w-3 h-3 inline mr-1 text-gray-400" />
                              {task.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    onDrop={(e) => handleDrop(e, hour, '30')}
                    onDragOver={handleDragOver}
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
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.text, 'schedule', `${hour}-30`, idx)}
                            className={`relative border-2 rounded p-2 shadow-sm cursor-move transition-all ${
                              task.completed
                                ? 'bg-gray-100 border-gray-300 opacity-60'
                                : 'bg-white border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center gap-1 absolute -top-2 -right-2">
                              {timeBlocks[`${hour}-30`].length > 1 && (
                                <>
                                  {idx > 0 && (
                                    <button
                                      onClick={() => moveTaskUp(`${hour}-30`, idx)}
                                      className="p-0.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 z-10"
                                      title="Mover arriba"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                  )}
                                  {idx < timeBlocks[`${hour}-30`].length - 1 && (
                                    <button
                                      onClick={() => moveTaskDown(`${hour}-30`, idx)}
                                      className="p-0.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 z-10"
                                      title="Mover abajo"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => removeTimeBlock(`${hour}-30`, idx)}
                                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                                title="Eliminar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div
                              onClick={() => toggleTaskComplete(`${hour}-30`, idx)}
                              className={`text-sm font-medium pr-16 cursor-pointer select-none ${
                                task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                              }`}
                            >
                              <GripVertical className="w-3 h-3 inline mr-1 text-gray-400" />
                              {task.text}
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