// Inicializar eventos
document.getElementById('iniciar').addEventListener('click', function () {
    const nome = document.getElementById('nome').value.trim();

    if (nome) {
        localStorage.setItem('nomeCompleto', nome);  // Armazenar nome no localStorage
        console.log('Nome salvo no localStorage:', nome);
        document.getElementById('form-nome').style.display = 'none';  // Esconder a tela de inserção de nome
        document.getElementById('tela-presentes').style.display = 'block';  // Mostrar a tela de presentes
    } else {
        alert('Por favor, insira seu nome completo!');
    }
});

// Armazenar presentes selecionados
let presentesSelecionados = [];

// Adicionar presentes à lista e alterar o botão para "Selecionado"
document.querySelectorAll('.escolher').forEach(button => {
    button.addEventListener('click', function () {
        const presente = this.getAttribute('data-presente');

        if (presentesSelecionados.includes(presente)) {
            alert('Este presente já foi selecionado!');
            return;
        }

        presentesSelecionados.push(presente);
        alert(`${presente} foi adicionado à sua lista!`);
        console.log('Presentes selecionados:', presentesSelecionados);

        
        // Alterar o texto e a cor do botão imediatamente
        this.textContent = 'Selecionado';
        this.style.backgroundColor = 'grey'; // Mudar a cor para cinza imediatamente
        this.style.cursor = 'not-allowed'; // Mudar o cursor
        this.classList.add('selecionado');
        this.disabled = true;

        // Verificar disponibilidade novamente
        verificarDisponibilidadePresentesGoogleSheets();
    });
});

// Função para manter o estado "Selecionado" ao carregar a página
function manterEstadoSelecionado() {
    document.querySelectorAll('.escolher').forEach(button => {
        const presente = button.getAttribute('data-presente');
        if (presentesSelecionados.includes(presente)) {
            button.textContent = 'Selecionado';
            button.classList.add('selecionado');
            button.disabled = true;
        }
    });
}

// Enviar dados para Google Sheets
document.getElementById('enviar').addEventListener('click', function () {
    const nome = localStorage.getItem('nomeCompleto');
    const dataHora = new Date().toLocaleString();

    console.log('Nome:', nome);
    console.log('DataHora:', dataHora);
    console.log('Presentes Selecionados:', presentesSelecionados);

    if (!nome || nome === "") {
        alert('Nome não encontrado. Por favor, insira seu nome novamente.');
        return;
    }

    if (presentesSelecionados.length === 0) {
        alert('Por favor, selecione ao menos um presente.');
        return;
    }

    const sheetData = {
        "data": [
            {
                "data": dataHora,
                "nomeCompleto": nome.trim(),
                "presentes": presentesSelecionados.join(', ')
            }
        ]
    };

    fetch('https://sheetdb.io/api/v1/qwuzp9h3ari92', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sheetData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao criar registro no Google Sheets');
        }
        return response.json();
    })
    .then(data => {
        alert('Lista enviada com sucesso! Obrigado por participar do nosso Chá de Panela!');
        console.log('Sucesso:', data);
        presentesSelecionados = [];
    })
    .catch((error) => {
        console.error('Erro:', error);
        alert('Houve um erro ao enviar sua lista. Detalhes do erro: ' + error.message);
    });
});

// Definir o limite de quantidade para cada presente (exemplo: 2 para "Conjunto de Panelas")
const limitesPresentes = {
    "Air fryer 2 em 1 - 11L (Philco)": 1,
    "Armário de cozinha" : 1,
    "Aspirador de pó (Preto)" : 1,
    "Conjunto de pratos" : 1,
    "Espelho grande" : 1,
    "Exaustor/depurador para cozinha" : 1,
    "Purificador de água" : 1,
    "Guarda-roupa" : 1,
    "Lua de mel" : 1,
    "Máquina lava e seca 10kg" : 1,
    "Mesa de jantar 4 lugares" : 1,
    "Microondas" : 1,
    "Multiprocessador - Philco" : 1,
    "Painel de TV 50 polegadas" : 1,
    "Panelas antiaderentes - Tramontina" : 1,
    "Panelas de pressão elétrica - Philco" : 1,
    "Sapateira" : 1,
    "TV de 50 polegadas" : 1
};

// Substitua por seu ID da planilha e API key gerada no Google Cloud
const spreadsheetId = '1STy321amnPhOZLwzJg47EPQtpxHPVZuywvZIdVSqxl4';
const apiKey = 'AIzaSyBvqOyDwCVKvluva0Rg0g8Z0vxYUipc5KA';

// Função para verificar disponibilidade
function verificarDisponibilidadePresentesGoogleSheets() {
    const range = 'Sheet1!A:C';  // Intervalo da planilha
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const rows = data.values;
            if (rows.length) {
                const contagemPresentes = {};

                rows.forEach(row => {
                    const presentesSelecionados = row[2] ? row[2].split(', ') : [];
                    presentesSelecionados.forEach(presente => {
                        if (!contagemPresentes[presente]) {
                            contagemPresentes[presente] = 1;
                        } else {
                            contagemPresentes[presente]++;
                        }
                    });
                });

                document.querySelectorAll('.escolher').forEach(button => {
                    const presente = button.getAttribute('data-presente');
                    const quantidade = contagemPresentes[presente] || 0;
                    const limite = limitesPresentes[presente];

                    // Seleciona o botão do Pix correspondente
                    const botaoPix = button.closest('.presente').querySelector('.pix');

                    if (button.classList.contains('selecionado')) {
                        return;  // Não mudar se já estiver selecionado
                    }

                    if (quantidade >= limite) {
                        // Tornar o botão de presente indisponível
                        button.textContent = 'Indisponível';
                        button.disabled = true;
                        button.classList.add('indisponivel');
                        button.style.cursor = 'not-allowed';

                        // Esconder o botão do Pix
                        if (botaoPix) {
                            botaoPix.style.display = 'none';
                        }
                    } else {
                        // Restabelecer o botão de presente se estiver disponível
                        button.textContent = 'Dar presente';
                        button.disabled = false;
                        button.classList.remove('indisponivel');
                        button.style.cursor = 'pointer';

                        // Exibir o botão do Pix se disponível
                        if (botaoPix) {
                            botaoPix.style.display = 'inline-block';
                        }
                    }
                });
            }
        })
        .catch(error => {
            console.error('Erro ao acessar a planilha do Google Sheets:', error);
        });
}

// Verificar disponibilidade ao carregar a página
window.addEventListener('load', () => {
    verificarDisponibilidadePresentesGoogleSheets();
    manterEstadoSelecionado(); // Manter o estado "Selecionado" ao carregar
});

// Verificar disponibilidade após cada seleção
document.querySelectorAll('.escolher').forEach(button => {
    button.addEventListener('click', verificarDisponibilidadePresentesGoogleSheets);
});

window.addEventListener('load', function() {
    window.scrollTo(0, 0);  // Força a rolagem para o topo da página
});

window.onload = function() {
    document.activeElement.blur();  // Remove o foco de qualquer elemento
    window.scrollTo(0, 0);          // Força a rolagem para o topo
};

// Impedir rolagem indesejada
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        window.scrollTo(0, 0); // Garantir que a página inicie no topo
    }, 100); // Ajuste o tempo conforme necessário
});
