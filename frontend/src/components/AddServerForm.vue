<script lang="ts" setup>
import { Button, Card, InputNumber, InputText, ProgressBar } from "primevue";
import { onUnmounted, ref } from "vue";
import { addServer } from "../services/serverService";

const serverName = ref("");
const bindPort = ref(2001);
const bindAddress = ref("0.0.0.0");
const a2sPort = ref(17777);
const rconPort = ref(19999);
const commandLine = ref("");

const currentStage = ref(0); // 0: Configuration, 1: Status, 2: Done
const logs = ref<string[]>([]);
const creationProgress = ref(0);
let logInterval: any = null;

async function submitForm()
{
  currentStage.value = 1;
  logs.value = ["Initializing server creation...", "Validating configuration..."];
  creationProgress.value = 10;

  try
  {
    const serverConfig = {
      name: serverName.value,
      bind_port: bindPort.value,
      bind_address: bindAddress.value,
      a2s_port: a2sPort.value,
      rcon_port: rconPort.value,
      command_line: commandLine.value || null,
    };

    const response = await addServer(serverConfig);
    logs.value.push("Server creation request sent to backend.");

    // Simulate backend logs
    const simulatedLogs = [
      "Downloading server binaries...",
      "Configuring network rules...",
      "Setting up RCON interface...",
      "Starting server instance...",
      "Waiting for health check...",
      "Server is now online!"
    ];

    let logIndex = 0;
    logInterval = setInterval(() =>
    {
      if (logIndex < simulatedLogs.length)
      {
        logs.value.push(simulatedLogs[logIndex]);
        creationProgress.value += 15;
        logIndex++;
      }
      else
      {
        clearInterval(logInterval);
        creationProgress.value = 100;
        setTimeout(() => currentStage.value = 2, 1000);
      }
    }, 1000);
  }
  catch (error)
  {
    logs.value.push("Error: Failed to create server.");
    console.error(error);
    currentStage.value = 0;
  }
}

onUnmounted(() =>
{
  if (logInterval)
    clearInterval(logInterval);
});
</script>

<template>
  <div class="flex-1 p-3 overflow-x-hidden">
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card class="p-6" :class="{ 'opacity-50 pointer-events-none': currentStage !== 0 }">
        <template #title>
          <h2 class="text-2xl font-bold mb-4">Add Server</h2>
        </template>

        <template #content>
          <form @submit.prevent="submitForm" class="space-y-4">
            <div>
              <label for="server-name" class="block text-sm font-medium mb-1">Server Name</label>
              <InputText id="server-name" v-model="serverName" placeholder="Enter server name" class="w-full" required />
            </div>

            <div>
              <label for="bind-port" class="block text-sm font-medium mb-1">Bind Port</label>
              <InputNumber id="bind-port" v-model="bindPort" placeholder="2001" class="w-full" />
            </div>

            <div>
              <label for="bind-address" class="block text-sm font-medium mb-1">Bind Address</label>
              <InputText id="bind-address" v-model="bindAddress" placeholder="0.0.0.0" class="w-full" />
            </div>

            <div>
              <label for="a2s-port" class="block text-sm font-medium mb-1">A2S Port</label>
              <InputNumber id="a2s-port" v-model="a2sPort" placeholder="17777" class="w-full" />
            </div>

            <div>
              <label for="rcon-port" class="block text-sm font-medium mb-1">RCON Port</label>
              <InputNumber id="rcon-port" v-model="rconPort" placeholder="19999" class="w-full" />
            </div>

            <div>
              <label for="command-line" class="block text-sm font-medium mb-1">Command Line</label>
              <InputText id="command-line" v-model="commandLine" placeholder="Optional command line" class="w-full" />
            </div>

            <Button type="submit" label="Add Server" class="mt-4 w-full" :disabled="currentStage !== 0" />
          </form>
        </template>
      </Card>

      <Card class="p-6">
        <template #title>
          <h2 class="text-2xl font-bold mb-4">
            <span v-if="currentStage === 0">Creation Status</span>
            <span v-else-if="currentStage === 1">Creating Server...</span>
            <span v-else>Server Created!</span>
          </h2>
        </template>

        <template #content>
          <div v-if="currentStage === 0" class="flex flex-col items-center justify-center h-full text-muted-color">
            <i class="pi pi-server text-4xl mb-4"></i>
            <p>Configure your server and click "Add Server" to begin the creation process.</p>
          </div>

          <div v-else-if="currentStage === 1" class="space-y-4">
            <ProgressBar :value="creationProgress"></ProgressBar>
            <div class="bg-emphasis p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
              <div v-for="(log, index) in logs" :key="index" class="mb-1 text-primary">
                <span class="opacity-50">[{{ new Date().toLocaleTimeString() }}]</span> {{ log }}
              </div>
            </div>
          </div>

          <div v-else-if="currentStage === 2" class="space-y-6">
            <div class="flex items-center gap-3 text-green-500 font-bold text-xl">
              <i class="pi pi-check-circle"></i>
              Success!
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="font-semibold">Server Name:</div>
              <div>{{ serverName }}</div>

              <div class="font-semibold">Bind Port:</div>
              <div>{{ bindPort }}</div>

              <div class="font-semibold">Bind Address:</div>
              <div>{{ bindAddress }}</div>

              <div class="font-semibold">A2S Port:</div>
              <div>{{ a2sPort }}</div>

              <div class="font-semibold">RCON Port:</div>
              <div>{{ rconPort }}</div>
            </div>

            <Button label="Go to Dashboard" class="w-full mt-4" @click="$router.push('/')" />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
/* Add any additional styles here */
</style>