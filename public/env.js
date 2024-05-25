async function loadEnv() {
  const apiKey = await fetch("/.env")
    .then((response) => response.text())
    .then((text) => {
      const envVars = {};
      text.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        envVars[key] = value;
      });
      return envVars.REACT_APP_GOOGLE_MAPS_API_KEY;
    });

  window.REACT_APP_GOOGLE_MAPS_API_KEY = apiKey;
}

loadEnv();
