export default function Spinner({ label = 'Cargando...' }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner__dot" />
      <span className="spinner__label">{label}</span>
    </div>
  );
}
