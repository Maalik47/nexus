export default function Footer() {
  return (
    <footer className="footer" id="soporte">
      <div className="footer__grid">
        <div>
          <h4>NEXUS</h4>
          <p>Construye tu setup perfecto con componentes de última generación.</p>
        </div>
        <div>
          <h4>Soporte</h4>
          <p>soporte@nexusgear.com</p>
          <p>+57 300 000 0000</p>
        </div>
        <div>
          <h4>Envíos</h4>
          <p>Envío gratis en compras superiores a $150.000</p>
        </div>
      </div>
      <p className="footer__legal">
        © {new Date().getFullYear()} NexusGear. Ingeniería de Software 2 - UIS.
      </p>
    </footer>
  );
}
