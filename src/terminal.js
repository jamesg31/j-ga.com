const terminal = document.getElementById("terminal");
const output = document.getElementById("output");
const commandInput = document.getElementById("command-input");
const prompt = "root@j-ga:~$ ";
const CHAR_WIDTH = 7.2;

const commands = {
  help: () => `Available commands:
  help     - Show this help message
  clear    - Clear the terminal
  about    - About me
  contact  - Contact information
  projects - View my projects`,
  clear: () => {
    output.innerHTML = "";
    return "";
  },
  about:
    () => `Hi, I'm James Gardner! I'm a software engineer passionate about building great software.
Feel free to explore my portfolio using the links above.`,
  contact: () => `You can reach me through:
  * LinkedIn: linkedin.com/in/j-ga
  * Github:   github.com/jamesg31`,
  projects: () => `Here are some of my projects:
Visit my Github profile for more: github.com/jamesg31`,
};

function updateCursorPosition() {
  const cursorElement = document.querySelector(".cursor");
  const textWidth = getTextWidth(commandInput.value);
  const promptWidth = prompt.length * CHAR_WIDTH;
  cursorElement.style.left = `${promptWidth + textWidth}px`;
}

function getTextWidth(text) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = "12px monospace";
  return context.measureText(text).width;
}

function executeCommand(cmd) {
  const trimmedCmd = cmd.trim().toLowerCase();

  if (trimmedCmd === "") return;

  const commandDiv = document.createElement("div");
  commandDiv.className = "output-line";
  commandDiv.textContent = prompt + cmd;
  output.appendChild(commandDiv);

  let result = "";
  if (commands[trimmedCmd]) {
    result = commands[trimmedCmd]();
  } else {
    result = `Command not found: ${trimmedCmd}. Type 'help' for available commands.`;
  }

  if (result) {
    const outputDiv = document.createElement("div");
    outputDiv.className = "output-line";
    outputDiv.textContent = result;
    output.appendChild(outputDiv);
  }

  terminal.scrollTop = terminal.scrollHeight;

  updateCursorPosition();
}

commandInput.addEventListener("input", updateCursorPosition);

window.addEventListener("load", updateCursorPosition);

commandInput.addEventListener("focus", updateCursorPosition);

commandInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const command = commandInput.value;
    commandInput.value = "";
    executeCommand(command);
  }
});

document.addEventListener("click", () => {
  commandInput.focus();
});
