import { useState, useEffect } from 'react'

const COLUMNS = ['To Do', 'In Progress', 'Done']
const PRIORITIES = ['Low', 'Medium', 'High']

export default function App() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('my-trello-tasks')
    if (savedTasks) {
      return JSON.parse(savedTasks).map(t => ({ ...t, priority: t.priority || 'Medium' }))
    }
    return []
  })

  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('Medium')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editTaskText, setEditTaskText] = useState('')

  useEffect(() => {
    localStorage.setItem('my-trello-tasks', JSON.stringify(tasks))
  }, [tasks])

  // ==========================================
  // TASK OPERATIONS
  // ==========================================
  const handleAddTask = (e) => {
    e.preventDefault()
    if (newTaskText.trim() === '') return

    const newTask = {
      id: Date.now(),
      text: newTaskText,
      status: 'To Do',
      priority: newTaskPriority
    }

    setTasks([...tasks, newTask])
    setNewTaskText('')
    setNewTaskPriority('Medium')
  }

  const handleDelete = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  // UPDATED: Now accepts a specific column name and clears only tasks in that column
  const handleClearColumn = (columnName) => {
    if (confirm(`Are you sure you want to delete all tasks in "${columnName}"?`)) {
      setTasks(tasks.filter(task => task.status !== columnName))
    }
  }

  // ==========================================
  // EDIT EXISTING TASKS
  // ==========================================
  const startEditing = (task) => {
    setEditingTaskId(task.id)
    setEditTaskText(task.text)
  }

  const saveEdit = () => {
    if (editTaskText.trim() === '') return
    setTasks(tasks.map(task => 
      task.id === editingTaskId ? { ...task, text: editTaskText } : task
    ))
    setEditingTaskId(null)
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') setEditingTaskId(null) 
  }

  // ==========================================
  // DRAG AND DROP
  // ==========================================
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId.toString())
  }

  const handleDragOver = (e) => {
    e.preventDefault() 
  }

  const handleDropOnColumn = (e, columnName) => {
    e.preventDefault()
    const draggedTaskId = parseInt(e.dataTransfer.getData('taskId'))
    
    setTasks(prevTasks => {
      const draggedTask = prevTasks.find(t => t.id === draggedTaskId)
      const filteredTasks = prevTasks.filter(t => t.id !== draggedTaskId)
      return [...filteredTasks, { ...draggedTask, status: columnName }]
    })
  }

  const handleDropOnTask = (e, targetTaskId, columnName) => {
    e.preventDefault()
    e.stopPropagation() 

    const draggedTaskId = parseInt(e.dataTransfer.getData('taskId'))
    if (draggedTaskId === targetTaskId) return 

    setTasks(prevTasks => {
      const draggedTask = prevTasks.find(t => t.id === draggedTaskId)
      const filteredTasks = prevTasks.filter(t => t.id !== draggedTaskId)
      const targetIndex = filteredTasks.findIndex(t => t.id === targetTaskId)
      
      filteredTasks.splice(targetIndex, 0, { ...draggedTask, status: columnName })
      return filteredTasks
    })
  }

  // ==========================================
  // HELPER STYLES & FORMATTING
  // ==========================================
  const getCardTheme = (status) => {
    switch (status) {
      case 'To Do': return { bg: '#fef2f2', border: '#f87171', text: '#991b1b' } 
      case 'In Progress': return { bg: '#fffbeb', border: '#fbbf24', text: '#b45309' } 
      case 'Done': return { bg: '#f0fdf4', border: '#4ade80', text: '#166534' } 
      default: return { bg: '#ffffff', border: '#e5e7eb', text: '#374151' }
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return { bg: '#fee2e2', text: '#ef4444' } 
      case 'Medium': return { bg: '#dbeafe', text: '#3b82f6' } 
      case 'Low': return { bg: '#f3f4f6', text: '#6b7280' } 
      default: return { bg: '#f3f4f6', text: '#6b7280' }
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric' 
    })
  }

  const displayedTasks = tasks.filter(task => 
    task.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ==========================================
  // UI RENDER
  // ==========================================
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { background-color: #ffffff; margin: 0; font-family: system-ui, -apple-system, sans-serif; }
        
        .task-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .task-card:hover { transform: translateY(-3px); box-shadow: 0 6px 12px rgba(0,0,0,0.08); }
        
        .action-btn { opacity: 0; transition: opacity 0.2s, color 0.2s; background: none; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 600; padding: 4px 8px; }
        .task-card:hover .action-btn { opacity: 1; }
        .action-btn.delete:hover { color: #dc2626 !important; }
        .action-btn.edit:hover { color: #2563eb !important; }
        
        .board-container::-webkit-scrollbar { height: 8px; }
        .board-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .board-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .board-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        ::placeholder { color: #9ca3af; opacity: 1; }
      `}</style>

      <div style={{ padding: '40px 2%', minHeight: '100vh', maxWidth: '98%', margin: '0 auto' }}>
        
        {/* Header & Search */}
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#111827', fontSize: '2.5rem', margin: '0 0 15px 0', fontWeight: '800' }}>
            Advanced Task Board
          </h1>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search tasks..." 
            style={{ padding: '10px 16px', width: '100%', maxWidth: '300px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#ffffff', color: '#111827' }}
          />
        </header>

        {/* Input Form */}
        <form onSubmit={handleAddTask} style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="What needs to be done?" 
            style={{ padding: '12px 16px', width: '100%', maxWidth: '350px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none', backgroundColor: '#ffffff', color: '#111827' }}
          />
          <select 
            value={newTaskPriority} 
            onChange={(e) => setNewTaskPriority(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#ffffff', color: '#111827', cursor: 'pointer' }}
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p} Priority</option>)}
          </select>
          <button 
            type="submit" 
            style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
          >
            Add Task
          </button>
        </form>

        {/* The Board */}
        <div className="board-container" style={{ display: 'flex', gap: '24px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '20px' }}>
          {COLUMNS.map(columnName => (
            <div 
              key={columnName} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnColumn(e, columnName)}
              style={{ 
                background: '#e0f2fe',
                flex: '1 1 0', 
                minWidth: '320px', 
                padding: '20px', 
                borderRadius: '12px', 
                minHeight: '500px', 
                border: '1px solid #bae6fd',
                display: 'flex', 
                flexDirection: 'column' 
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, color: '#0369a1', fontSize: '1.1rem' }}>{columnName}</h3>
                  <span style={{ background: '#bae6fd', color: '#0369a1', padding: '2px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {displayedTasks.filter(task => task.status === columnName).length}
                  </span>
                </div>
                
                {/* Clear Column Button now appears on any column that has tasks */}
                {displayedTasks.filter(task => task.status === columnName).length > 0 && (
                  <button 
                    onClick={() => handleClearColumn(columnName)} 
                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Clear {columnName === 'In Progress' ? 'Progress' : columnName}
                  </button>
                )}
              </div>
              
              {/* Task Cards */}
              <div style={{ flex: 1 }}>
                {displayedTasks.filter(task => task.status === columnName).map(task => {
                  const theme = getCardTheme(columnName); 
                  const priorityStyle = getPriorityColor(task.priority);
                  const isEditing = editingTaskId === task.id;

                  return (
                    <div 
                      key={task.id} 
                      draggable={!isEditing} 
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnTask(e, task.id, columnName)}
                      className="task-card"
                      onDoubleClick={() => startEditing(task)}
                      style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, padding: '16px', borderRadius: '8px', marginBottom: '12px', cursor: isEditing ? 'text' : 'grab', position: 'relative' }}
                    >
                      {/* Priority Tag & Date */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ background: priorityStyle.bg, color: priorityStyle.text, padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          {task.priority}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                          {formatDate(task.id)}
                        </span>
                      </div>
                      
                      {/* Task Text or Edit Input */}
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editTaskText}
                          onChange={(e) => setEditTaskText(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleEditKeyDown}
                          style={{ width: '100%', padding: '8px', border: `1px solid ${theme.border}`, borderRadius: '4px', outline: 'none', fontSize: '1rem', fontFamily: 'inherit', background: '#ffffff', color: '#111827' }}
                        />
                      ) : (
                        <p style={{ margin: '0 0 12px 0', fontWeight: '600', lineHeight: '1.4', wordBreak: 'break-word' }}>
                          {task.text}
                        </p>
                      )}
                      
                      {/* Card Actions (Hover) */}
                      {!isEditing && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                          <button onClick={() => startEditing(task)} className="action-btn edit" style={{ color: theme.text }}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(task.id)} className="action-btn delete" style={{ color: theme.text }}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}