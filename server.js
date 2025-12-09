
const net = require("net");
const fs = require("fs");
const prompt = require("prompt-sync")();

const HISTORICO = "historico.json";

// --- CRUD simples ---
function salvarPartida(partida) {
    let historico = [];
    if (fs.existsSync(HISTORICO)) {
        historico = JSON.parse(fs.readFileSync(HISTORICO));
    }
    historico.push(partida);
    fs.writeFileSync(HISTORICO, JSON.stringify(historico, null, 2));
}

function listarPartidas() {
    if (!fs.existsSync(HISTORICO)) return [];
    return JSON.parse(fs.readFileSync(HISTORICO));
}

function limparHistorico() {
    fs.writeFileSync(HISTORICO, "[]");
}

// --- Regras ---
function decidirVencedor(j1, j2) {
    if (j1 === j2) return "empate";

    const regras = {
        pedra: "tesoura",
        papel: "pedra",
        tesoura: "papel"
    };

    return regras[j1] === j2 ? "jogador1" : "jogador2";
}

// --- Jogar ---
function iniciarJogo(socket, isHost) {

    if (isHost) console.log("Jogador conectado!\n");

    const jogadaLocal = prompt("Sua jogada (pedra/papel/tesoura): ");
    socket.write(jogadaLocal);

    socket.on("data", (data) => {
        const jogadaOponente = data.toString();

        const resultado = decidirVencedor(jogadaLocal, jogadaOponente);

        console.log("\nVocê jogou:", jogadaLocal);
        console.log("Oponente jogou:", jogadaOponente);
        console.log("Resultado:", resultado);

        salvarPartida({
            jogadaLocal,
            jogadaOponente,
            resultado,
            data: new Date().toISOString()
        });

        process.exit();
    });
}

// --- Host ---
function hostear() {
    const server = net.createServer((socket) => iniciarJogo(socket, true));

    server.listen(5000, () => {
        console.log("Aguardando jogador na porta 5000");
    });
}

// --- Join ---
function conectar(ip) {
    const socket = new net.Socket();
    socket.connect(5000, ip, () => {
        console.log("Conectado ao host!\n");
        iniciarJogo(socket, false);
    });
}

// --- CLI ---
const cmd = process.argv[2];
const arg = process.argv[3];

switch (cmd) {
    case "host":
        hostear();
        break;
    case "join":
        conectar(arg);
        break;
    case "listar":
        console.log(listarPartidas());
        break;
    case "limpar":
        limparHistorico();
        console.log("Histórico apagado.");
        break;
    default:
        console.log(`
Comandos:

  Iniciar host:
    node server.js host

  Entrar no host:
    node server.js join <ip>

CRUD:
    node server.js listar
    node server.js limpar
        `);
}
