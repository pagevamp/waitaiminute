import { getSettings, setSettings } from "../shared/storage";

const toggle = document.getElementById("enableToggle") as HTMLInputElement;
const messagesToggle = document.getElementById("messagesToggle") as HTMLInputElement;
const sensitiveToggle = document.getElementById("sensitiveToggle") as HTMLInputElement;
const subToggles = document.getElementById("subToggles") as HTMLElement;

function updateSubTogglesState(masterEnabled: boolean) {
  messagesToggle.disabled = !masterEnabled;
  sensitiveToggle.disabled = !masterEnabled;
  subToggles.classList.toggle("disabled", !masterEnabled);
}

async function init() {
  const settings = await getSettings();
  toggle.checked = settings.enabled;
  messagesToggle.checked = settings.messagesEnabled;
  sensitiveToggle.checked = settings.sensitiveInfoEnabled;
  updateSubTogglesState(settings.enabled);

  toggle.addEventListener("change", async () => {
    await setSettings({ enabled: toggle.checked });
    updateSubTogglesState(toggle.checked);
  });

  messagesToggle.addEventListener("change", async () => {
    await setSettings({ messagesEnabled: messagesToggle.checked });
  });

  sensitiveToggle.addEventListener("change", async () => {
    await setSettings({ sensitiveInfoEnabled: sensitiveToggle.checked });
  });
}

init();
