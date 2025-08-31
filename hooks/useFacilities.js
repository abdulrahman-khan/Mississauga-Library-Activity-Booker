import { useState, useCallback } from 'react'

export const useFacilities = () => {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadFacilities = useCallback(async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      setError('Electron API not available')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await window.electronAPI.getFacilities()
      setFacilities(data || [])
    } catch (err) {
      console.error('Error loading facilities:', err)
      setError('Failed to load facilities. Please refresh the app.')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      setError('Electron API not available')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      await window.electronAPI.refreshCookies()
      await loadFacilities()
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }, [loadFacilities])

  const getAvailability = useCallback(async (facilityId, date) => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available')
    }

    return await window.electronAPI.getFacilityAvailability(facilityId, date)
  }, [])

  const getFacilitiesByCenter = useCallback(async (centerName) => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available')
    }

    return await window.electronAPI.getFacilitiesByCenter(centerName)
  }, [])

  const getUniqueCenters = useCallback(async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available')
    }

    return await window.electronAPI.getUniqueCenters()
  }, [])

  return {
    facilities,
    loading,
    error,
    loadFacilities,
    refreshData,
    getAvailability,
    getFacilitiesByCenter,
    getUniqueCenters
  }
}