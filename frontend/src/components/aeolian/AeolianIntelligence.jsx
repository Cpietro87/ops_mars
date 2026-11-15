import { useState, useEffect } from 'react'
import { Wind } from 'lucide-react'

const DEFAULT_BASE_URL = 'http://127.0.0.1:8000'

export default function AeolianIntelligence() {
  const [datasets, setDatasets] = useState([])
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)

  const savedBaseUrl = localStorage.getItem('aeolian_intelligence_base_url')

  useEffect(() => {
    if (savedBaseUrl) setBaseUrl(parseFloat(savedBaseUrl))
  }, [])

  useEffect(() => {
    localStorage.setItem('aeolian_intelligence_base_url', String(baseUrl))
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

  const loadAnalysis = async (datasetId) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/api/v1/aeolian/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataset_id: datasetId }),
      })
      if (!response.ok) throw new Error('Failed to trigger analysis')
      const result = await response.json()
      setAnalyses(prev => [...prev, result])
    } catch (error) {
      console.error('Error triggering analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatMethod = (method) => {
    const methods = {
      centroid: 'Centroid',
      crest: 'Crest',
      advancing_front: 'Advancing Front',
      geometry: 'Geometry Change',
    }
    return methods[method] || method
  }

  const formatStatus = (valid) => valid ? 'Valid' : 'Invalid'

  return (
    <div className="aeolian-intelligence">
      <div className="aeolian-intelligence-header">
        <Wind className="aeolian-intelligence-icon" />
        <span>Inteligencia Aeoliana</span>
      </div>

      <div className="aeolian-intelligence-content">
        <div className="aeolian-dataset-selector">
          <h3>Datasetos Aeolian</h3>
          {loading ? (
            <p>Cargando datasets...</p>
          ) : datasets.length === 0 ? (
            <p>No hay datasets disponibles</p>
          ) : (
            <select
              onChange={(e) => setSelectedDataset(e.target.value)}
            >
              <option value="">Seleccionar dataset</option>
              {datasets.map((ds) => (
                <option key={ds.dataset_id} value={ds.dataset_id}>
                  {ds.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={loadAnalysis}
            disabled={!selectedDataset}
            className="btn-small">
              Analizar dataset
          </button>
        </div>

        <div className="aeolian-analyses-list">
          {analyses.map((analysis, idx) => (
            <div
              key={idx}
              className="aeolian-analysis-card"
            >
              <h4>Análisis #{idx + 1}</h4>
              <p><strong>Dataset:</strong> {selectedDataset || 'Ninguno'}</p>
              <p><strong>Estado:</strong> {analysis.status || 'pending'}</p>
              <p><strong>Método:</strong> {formatMethod(analysis.method || 'unknown')}</p>
              <p><strong>Desplazamiento:</strong> {analysis.displacement_dx_m !== undefined ? analysis.displacement_dx_m : 'N/A'} m (dx), {analysis.displacement_dy_m !== undefined ? analysis.displacement_dy_m : 'N/A'} m (dy)</p>
              <p><strong>Distancia:</strong> {analysis.distance_m !== undefined ? analysis.distance_m : 'N/A'} m</p>
              <p><strong>Tasa:</strong> {analysis.rate_m_per_earth_year !== undefined ? analysis.rate_m_per_earth_year : 'N/A'} m/año Tierra</p>
              <p><strong>Error estándar:</strong> {analysis.rate_standard_error_m_per_earth_year !== undefined ? analysis.rate_standard_error_m_per_earth_year : 'N/A'} m/año Tierra</p>
              <p><strong>CI 95%:</strong> {analysis.distance_ci95_m !== undefined ? `${analysis.distance_ci95_m[0]} - ${analysis.distance_ci95_m[1]}` : 'N/A'} m</p>
              <p><strong>Valid:</strong> {formatStatus(analysis.valid)}</p>
              {analysis.reasons && analysis.reasons.length > 0 && (
                <p><strong>Motivos de rechazo:</strong> {analysis.reasons.map((r) => <span key={r}>{r}</span>)}</p>
              )}
              <p><strong>Suposiciones:</strong> {analysis.assumptions && analysis.assumptions.length > 0 ? analysis.assumptions.map((a) => <span key={a}>{a}</span>) : 'Ninguna'}</p>
              <hr />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}