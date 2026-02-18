import { getSettings, setSettings } from "../shared/storage";

const toggle = document.getElementById("enableToggle") as HTMLInputElement;

async function init() {
  const { enabled } = await getSettings();
  toggle.checked = enabled;

  toggle.addEventListener("change", async () => {
    await setSettings({ enabled: toggle.checked });
  });
}

init();
