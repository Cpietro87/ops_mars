import { useState, useEffect } from 'react'
import { Microscope, LayerGroup, LayoutDashboard, TrendingUp } from 'lucide-react'
import { marsApi } from '../services/marsApi.js'

const DEFAULT_BASE_URL = 'http://127.0.0.1:8000'

export default function DuneIntelligence() {
  const [datasets, setDatasets] = useState([])
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)

  useEffect(() => {
    const saved = localStorage.getItem('dune_intelligence_base_url')
    if (saved) setBaseUrl(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('dune_intelligence_base_url', baseUrl)
  }, [baseUrl])

  useEffect(() => {
    loadDatasets()
  }, [baseUrl])

  const loadDatasets = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/api/v1/aeolian/datasets`)
      if (!response.ok) throw new Error('Failed to fetch datasets')
      const data = await response.json()
      setDatasets(data.data || [])
    } catch (error) {
      console.error('Error fetching datasets:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalyses = async (datasetId) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/api/v1/aeolian/datasets/${datasetId}`)
      if (!response.ok) throw new Error('Failed to fetch dataset details')
      const data = await response.json()
      setAnalyses(data.analysis_capability ? [{ type: 'capability', data }] : [])
    } catch (error) {
      console.error('Error fetching analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAnalysis = (analysis) => {
    if (!analysis) return null
    const capabilities = analysis.analysis_capability || {}
    return {
      temporal_analysis: capabilities.temporal_analysis,
      analysis_ready: capabilities.analysis_ready,
      local_observations_required: capabilities.local_observations_required,
      blockers: capabilities.blockers || [],
      published_migration_m_per_earth_year: capabilities.published_migration_m_per_earth_year,
      published_flux_m3_per_m_per_earth_year: capabilities.published_flux_m3_per_m_per_earth_year,
    }
  }

  return (
    <div className="dune-intelligence">
      <div className="dune-intelligence-header">
        <LayerGroup className="dune-intelligence-icon" />
        <span>Inteligencia de Dunas</span>
      </div>

      <div className="dune-intelligence-content">
        {/* Dataset selector */}
        <div className="dune-dataset-selector">
          <h3>Datasetos disponibles</h3>
          {loading ? (
            <p>Cargando datasets...</p>
          ) : datasets.length === 0 ? (
            <p>No hay datasets disponibles</p>
          ) : (
            <select
              onChange={(e) => {
                setSelectedDataset(e.target.value)
                loadAnalyses(e.target.value)
              }}
            >
              <option value="">Seleccionar dataset</option>
              {datasets.map((ds) => (
                <option key={ds.dataset_id} value={ds.dataset_id}>
                  {ds.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Analysis viewer */}
        {selectedDataset && (
          <div className="dune-analysis-viewer">
            <h3>Análisis disponibles</h3>
            {loading ? (
              <p>Cargando análisis...</p>
            ) : !analyses.length ? (
              <p>No hay análisis disponibles para este dataset</p>
            ) : (
              <select
                onChange={(e) => setSelectedAnalysis(e.target.value)}
              >
                <option value="">Seleccionar análisis</option>
                {analyses.map((a) => (
                  <option key="capability" value="capability">
                    {selectedAnalysis === 'capability' ? 'Capabilidad de análisis' : 'Análisis'}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Analysis details */}
        {selectedAnalysis && (
          <div className="dune-analysis-details">
            <h3>Detalles del análisis</h3>
            {formatAnalysis(selectedAnalysis.data?.data || selectedAnalysis.data) && (
              <div className="analysis-capability">
                <h4>Capacidades de análisis</h4>
                <ul>
                  {selectedAnalysis.data.data.temporal_analysis && <li>Análisis temporal disponible</li>}
                  {selectedAnalysis.data.data.analysis_ready && <li>Listo para análisis</li>}
                  {selectedAnalysis.data.data.local_observations_required && <li>Observaciones locales requeridas</li>}
                  {selectedAnalysis.data.data.blockers && (
                    <li>Bloqueos: {selectedAnalysis.data.data.blockers.map((b) => <span key={b}>{b}</span>)}</li>
                  )}
                  {selectedAnalysis.data.data.published_migration_m_per_earth_year && (
                    <li>
                      Migración publicada: {selectedAnalysis.data.data.published_migration_m_per_earth_year.map(
                        (m) => `${m} m/año Tierra`
                      )}`
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}