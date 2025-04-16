const terminal = document.getElementById("terminal");
const output = document.getElementById("output");
const commandInput = document.getElementById("command-input");
let prompt = "root@j-ga:~$ ";
const CHAR_WIDTH = 7.2;

const fileSystem = {
  "~": {
    type: "directory",
    contents: {
      "contact.txt": {
        type: "file",
        content: `Email: james@gardna.net
LinkedIn: linkedin.com/in/j-ga`,
      },
      projects: {
        type: "directory",
        contents: {
          "website.txt": {
            type: "file",
            content: `This site! Its built with pure HTML, CSS, and JavaScript.`,
          },
        },
      },
    },
  },
};

let currentPath = "~";
let currentDir = fileSystem["~"];

function updatePrompt() {
  let displayPath = currentPath;
  prompt = `root@j-ga:${displayPath}$ `;

  const promptElement = document.querySelector(".prompt");
  if (promptElement) {
    promptElement.textContent = prompt;
  }

  updateCursorPosition();
}

function navigateToPath(path) {
  if (path === "~" || path === "") {
    currentPath = "~";
    currentDir = fileSystem["~"];
    updatePrompt();
    return true;
  }

  if (path === "/") {
    return false;
  }

  if (path.startsWith("~/")) {
    const relativePath = path.substring(2);
    return navigateFromDirectory(fileSystem["~"], relativePath, "~");
  }

  if (path.startsWith("/")) {
    const relativePath = path.substring(1);
    return navigateFromDirectory(fileSystem["/"], relativePath, "/");
  }

  return navigateFromDirectory(currentDir, path, currentPath);
}

function navigateFromDirectory(startDir, relativePath, basePath) {
  if (!relativePath) {
    currentPath = basePath;
    currentDir = startDir;
    updatePrompt();
    return true;
  }

  const parts = relativePath.split("/").filter((part) => part !== "");
  let targetDir = startDir;
  let newPath = basePath;

  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      if (newPath !== "~" && newPath !== "/") {
        const pathParts = newPath.split("/");
        pathParts.pop();
        newPath = pathParts.join("/") || (newPath.startsWith("~") ? "~" : "/");
        targetDir = fileSystem[newPath === "~" ? "~" : "/"];
        for (let i = 1; i < pathParts.length; i++) {
          if (pathParts[i]) {
            targetDir = targetDir.contents[pathParts[i]];
          }
        }
        continue;
      }
      continue;
    }

    if (
      !targetDir.contents ||
      !targetDir.contents[part] ||
      targetDir.contents[part].type !== "directory"
    ) {
      return false;
    }

    targetDir = targetDir.contents[part];
    newPath = newPath === "/" ? `/${part}` : `${newPath}/${part}`;
  }

  currentPath = newPath;
  currentDir = targetDir;
  updatePrompt();
  return true;
}

function getFileContent(path) {
  if (path === "~") {
    return null;
  }

  if (path.startsWith("~/")) {
    const relativePath = path.substring(2);
    return getFileFromDirectory(fileSystem["~"], relativePath);
  }

  if (path.startsWith("/")) {
    const relativePath = path.substring(1);
    return getFileFromDirectory(fileSystem["/"], relativePath);
  }

  return getFileFromDirectory(currentDir, path);
}

function getFileFromDirectory(startDir, relativePath) {
  if (!relativePath) {
    return null;
  }

  const parts = relativePath.split("/").filter((part) => part !== "");
  let current = startDir;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (!current.contents || !current.contents[part]) {
      return null;
    }

    current = current.contents[part];

    if (i === parts.length - 1 && current.type === "file") {
      return current.content;
    }

    if (i < parts.length - 1 && current.type !== "directory") {
      return null;
    }
  }

  return null;
}

const commands = {
  help: () => `Available commands:
  help     - Show this help message
  clear    - Clear the terminal
  ls       - List files in current directory
  cd       - Change directory
  cat      - Display file content
  whoami   - Display current user
  pwd      - Print working directory`,
  clear: () => {
    output.innerHTML = "";
    return "";
  },
  ls: (args) => {
    const path = args ? args.trim() : "";

    if (path) {
      if (path === "~") {
        return Object.keys(fileSystem["~"].contents).join("  ");
      }

      if (path.startsWith("~/")) {
        const relativePath = path.substring(2);
        return listDirectoryContents(fileSystem["~"], relativePath);
      }

      if (path.startsWith("/")) {
        const relativePath = path.substring(1);
        return listDirectoryContents(fileSystem["/"], relativePath);
      }

      return listDirectoryContents(currentDir, path);
    } else {
      return Object.keys(currentDir.contents).join("  ");
    }
  },
  cd: (args) => {
    if (!args) {
      navigateToPath("~");
      return "";
    }

    const path = args.trim();

    if (navigateToPath(path)) {
      return "";
    } else {
      return `cd: no such directory: ${path}`;
    }
  },
  cat: (args) => {
    if (!args) {
      return "cat: missing file operand";
    }

    const path = args.trim();
    const content = getFileContent(path);

    if (content === null) {
      return `cat: ${path}: No such file`;
    }

    return content;
  },
  pwd: () => {
    return currentPath.replace("~", "/home/root");
  },
  whoami: () => "root",
};

function listDirectoryContents(startDir, relativePath) {
  if (!relativePath) {
    return Object.keys(startDir.contents).join("  ");
  }

  const parts = relativePath.split("/").filter((part) => part !== "");
  let current = startDir;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (!current.contents || !current.contents[part]) {
      return `ls: cannot access '${relativePath}': No such directory`;
    }

    current = current.contents[part];

    if (current.type !== "directory") {
      return `ls: cannot access '${relativePath}': Not a directory`;
    }

    if (i === parts.length - 1) {
      return Object.keys(current.contents).join("  ");
    }
  }

  return Object.keys(current.contents).join("  ");
}

function handleTabAutocomplete(e) {
  if (e.key === "Tab") {
    e.preventDefault();

    const input = commandInput.value;
    const parts = input.split(" ");

    if (parts.length > 1) {
      const pathToComplete = parts[parts.length - 1];
      let baseDir = currentDir;
      let basePath = currentPath;
      let pathPrefix = "";

      if (pathToComplete.startsWith("/")) {
        baseDir = fileSystem["/"];
        basePath = "/";
        pathPrefix = "/";
      } else if (pathToComplete.startsWith("~/")) {
        baseDir = fileSystem["~"];
        basePath = "~";
        pathPrefix = "~/";
        pathToComplete = pathToComplete.substring(2);
      } else if (pathToComplete.includes("/")) {
        const pathParts = pathToComplete.split("/");
        const lastPart = pathParts.pop();
        const dirPath = pathParts.join("/");

        if (dirPath) {
          const tempPath = dirPath.startsWith("/")
            ? dirPath
            : `${basePath}/${dirPath}`;
          const tempDir = getDirectoryFromPath(tempPath);

          if (tempDir) {
            baseDir = tempDir;
            pathPrefix = dirPath + "/";
            pathToComplete = lastPart;
          } else {
            return;
          }
        }
      }

      const matches = Object.keys(baseDir.contents).filter((item) =>
        item.startsWith(pathToComplete)
      );

      if (matches.length === 1) {
        // Single match - complete it
        const newPath = pathPrefix + matches[0];
        parts[parts.length - 1] = newPath;
        commandInput.value = parts.join(" ");
      } else if (matches.length > 1) {
        // Multiple matches - show them
        const outputDiv = document.createElement("div");
        outputDiv.className = "output-line";
        outputDiv.textContent = matches.join("  ");
        output.appendChild(outputDiv);
        terminal.scrollTop = terminal.scrollHeight;
      }

      updateCursorPosition();
    }
  }
}

function getDirectoryFromPath(path) {
  if (path === "~" || path === "") {
    return fileSystem["~"];
  }

  if (path === "/") {
    return fileSystem["/"];
  }

  if (path.startsWith("~/")) {
    const relativePath = path.substring(2);
    return getDirectoryFromRelativePath(fileSystem["~"], relativePath);
  }

  if (path.startsWith("/")) {
    const relativePath = path.substring(1);
    return getDirectoryFromRelativePath(fileSystem["/"], relativePath);
  }

  return getDirectoryFromRelativePath(currentDir, path);
}

function getDirectoryFromRelativePath(startDir, relativePath) {
  if (!relativePath) {
    return startDir;
  }

  const parts = relativePath.split("/").filter((part) => part !== "");
  let current = startDir;

  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      continue;
    }

    if (
      !current.contents ||
      !current.contents[part] ||
      current.contents[part].type !== "directory"
    ) {
      return null;
    }

    current = current.contents[part];
  }

  return current;
}

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
  const trimmedCmd = cmd.trim();

  if (trimmedCmd === "") return;

  const commandDiv = document.createElement("div");
  commandDiv.className = "output-line";
  commandDiv.textContent = prompt + cmd;
  output.appendChild(commandDiv);

  let result = "";

  const parts = trimmedCmd.split(" ");
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ");

  if (commands[command]) {
    result = commands[command](args);
  } else {
    result = `Command not found: ${command}. Type 'help' for available commands.`;
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

function updateLastLogin() {
  const now = new Date();
  const lastLogin = localStorage.getItem("lastLogin");
  localStorage.setItem("lastLogin", now.toISOString());

  const lastLoginElement = document.getElementById("last-login");
  if (lastLoginElement) {
    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      lastLoginElement.textContent = `Last login: ${lastLoginDate.toLocaleString()} from 192.168.1.100`;
    } else {
      lastLoginElement.textContent = `Last login: ${now.toLocaleString()} from 192.168.1.100`;
    }
  }
}

commandInput.addEventListener("input", updateCursorPosition);

window.addEventListener("load", () => {
  updatePrompt();
  updateCursorPosition();
});

commandInput.addEventListener("focus", updateCursorPosition);

commandInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const command = commandInput.value;
    commandInput.value = "";
    executeCommand(command);
  }
});

commandInput.addEventListener("keydown", handleTabAutocomplete);

document.addEventListener("click", () => {
  commandInput.focus();
});

document.addEventListener("DOMContentLoaded", updateLastLogin);
