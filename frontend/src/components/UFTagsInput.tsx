import { useState, useEffect, useRef } from 'react'
import './UFTagsInput.css'

interface UFTagsInputProps {
  value: string[] // Array de UFs
  onChange: (ufs: string[]) => void
}

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export default function UFTagsInput({ value, onChange }: UFTagsInputProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredUFs = UFS.filter(uf => 
    uf.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const availableUFs = filteredUFs.filter(uf => !value.includes(uf))

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectUF = (uf: string) => {
    if (!value.includes(uf)) {
      onChange([...value, uf])
    }
    setSearchTerm('')
    setShowDropdown(false)
  }

  const handleRemoveUF = (uf: string) => {
    onChange(value.filter(u => u !== uf))
  }

  return (
    <div className="uf-tags-input">
      <div className="uf-tags-container">
        {value.map((uf) => (
          <span key={uf} className="uf-tag">
            {uf}
            <button
              type="button"
              onClick={() => handleRemoveUF(uf)}
              className="uf-tag-remove"
              aria-label={`Remover ${uf}`}
            >
              ×
            </button>
          </span>
        ))}
        <div className="uf-tags-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => {
              if (searchTerm.trim() || availableUFs.length > 0) {
                setShowDropdown(true)
              }
            }}
            placeholder={value.length === 0 ? 'Selecione as UFs...' : ''}
            className="uf-tags-input-field"
          />
          {showDropdown && availableUFs.length > 0 && (
            <div ref={dropdownRef} className="uf-tags-dropdown">
              {availableUFs.map((uf) => (
                <div
                  key={uf}
                  className="uf-tags-dropdown-item"
                  onClick={() => handleSelectUF(uf)}
                >
                  {uf}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
