/**
 * Home Page (pages/index.tsx)
 * 
 * Purpose: Main application page that coordinates all components
 * 
 * Component Structure:
 * - Header: App title and branding
 * - FacilityDropdown: Select facility center (top section)
 * - Left Panel: ResourceList - shows available resources for selected facility
 * - Right Panel: TimeView - shows weekly availability calendar for selected resource  
 * - Footer: Additional info and links
 * 
 * State Management:
 * - selectedFacility: Currently selected facility center name
 * - selectedResource: Currently selected resource/room object
 * - persistedWeekStart: Maintains calendar week across resource changes
 * 
 * Data Flow:
 * 1. User selects facility center → FacilityDropdown calls handleFacilitySelect
 * 2. selectedFacility updates → ResourceList loads resources for that facility
 * 3. User clicks resource → ResourceList calls handleResourceSelect  
 * 4. selectedResource updates → TimeView loads availability for that resource
 * 5. TimeView displays weekly calendar with booking status
 */

import { useState } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FacilityDropdown from '../components/FacilityDropdown'
import ResourceList from '../components/ResourceList'
import TimeView from '../components/TimeView'

interface Resource {
  id: string;           // Unique resource ID for API calls
  name: string;         // Full facility name
  facility_id: string;  // API facility identifier
  facility_name: string;
  center_name: string;  // Parent facility center
}

export default function Home() {
  // Application state
  const [selectedFacility, setSelectedFacility] = useState<string>('')           // Currently selected facility center
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null) // Currently selected resource
  const [persistedWeekStart, setPersistedWeekStart] = useState<Date | null>(null) // Maintains calendar week position

  /**
   * handleFacilitySelect - Called when user selects a facility center from dropdown
   * 
   * Actions:
   * 1. Updates selectedFacility state with the new facility center name
   * 2. Clears selectedResource (user needs to pick a new resource from the new facility)
   * 3. This triggers ResourceList to load resources for the new facility
   */
  const handleFacilitySelect = (facilityName: string) => {
    setSelectedFacility(facilityName)
    setSelectedResource(null) // Clear selected resource when facility changes
  }

  /**
   * handleResourceSelect - Called when user clicks on a resource in ResourceList
   * 
   * Actions:
   * 1. Updates selectedResource state with the clicked resource object
   * 2. This triggers TimeView to load availability data for the selected resource
   * 3. TimeView displays the weekly calendar with booking information
   */
  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource(resource)
  }

  return (
    <>
      <Head>
        <title>Facility Availability Checker</title>
        <meta name="description" content="Check facility booking availability in Mississauga" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col"
        style={{ backgroundImage: "url('/images/franco-debartolo-PtfhoMcNCs0-unsplash.jpg')" }}>
        <Header />

        <div className="flex-1 p-4">
          <div className="mb-4">
            <FacilityDropdown
              onFacilitySelect={handleFacilitySelect}
              selectedFacility={selectedFacility}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[calc(100vh-12rem)]">
            <div className="lg:col-span-1">
              <ResourceList
                selectedFacility={selectedFacility}
                onResourceSelect={handleResourceSelect}
                selectedResource={selectedResource}
              />
            </div>

            <div className="lg:col-span-2">
              <TimeView
                selectedResource={selectedResource}
                persistedWeekStart={persistedWeekStart}
                onWeekStartChange={setPersistedWeekStart}
              />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}