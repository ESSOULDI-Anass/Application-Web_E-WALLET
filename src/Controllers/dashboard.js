import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid } from "../Model/database.js";

const user = JSON.parse(sessionStorage.getItem("currentUser"));

// DOM elements
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");
const transferBtn = document.getElementById("quickTransfer");
const transferSection = document.getElementById("transferPopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");
const submitTransferBtn = document.getElementById("submitTransferBtn");

// Guard
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
transferBtn.addEventListener("click", handleTransfersection);
closeTransferBtn.addEventListener("click", closeTransfer);
cancelTransferBtn.addEventListener("click", closeTransfer);
submitTransferBtn.addEventListener("click", handleTransfer);

// Retrieve dashboard data
const getDashboardData = () => {
  const monthlyIncome = user.wallet.transactions
    .filter((t) => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter((t) => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  return {
    userName: user.name,
    currentDate: new Date().toLocaleDateString("fr-FR"),
    availableBalance: `${user.wallet.balance} ${user.wallet.currency}`,
    activeCards: user.wallet.cards.length,
    monthlyIncome: `${monthlyIncome} MAD`,
    monthlyExpenses: `${monthlyExpenses} MAD`,
  };
};

function renderDashboard() {
  const dashboardData = getDashboardData();
  if (dashboardData) {
    greetingName.textContent = dashboardData.userName;
    currentDate.textContent = dashboardData.currentDate;
    solde.textContent = dashboardData.availableBalance;
    incomeElement.textContent = dashboardData.monthlyIncome;
    expensesElement.textContent = dashboardData.monthlyExpenses;
    activecards.textContent = dashboardData.activeCards;
  }

  transactionsList.innerHTML = "";
  user.wallet.transactions.forEach((transaction) => {
    const transactionItem = document.createElement("div");
    transactionItem.className = "transaction-item";
    transactionItem.innerHTML = `
      <div>${transaction.date}</div>
      <div>${transaction.amount} MAD</div>
      <div>${transaction.type}</div>
    `;
    transactionsList.appendChild(transactionItem);
  });
}

renderDashboard();

// Transfer popup
function closeTransfer() {
  transferSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

function handleTransfersection() {
  transferSection.classList.add("active");
  document.body.classList.add("popup-open");
}

// Beneficiaries
const beneficiaries = getbeneficiaries(user.id);

function renderBeneficiaries() {
  beneficiaries.forEach((beneficiary) => {
    const option = document.createElement("option");
    option.value = beneficiary.id;
    option.textContent = beneficiary.name;
    beneficiarySelect.appendChild(option);
  });
}
renderBeneficiaries();

function renderCards() {
  user.wallet.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type + "****" + card.numcards;
    sourceCard.appendChild(option);
  });
}
renderCards();


function checkUser(numcompte) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const beneficiary = finduserbyaccount(numcompte);
      if (beneficiary) {
        resolve(beneficiary); 
      } else {
        reject("Destinataire introuvable"); 
      }
    }, 2000);
  });
}


function checkSolde(expediteur, amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (expediteur.wallet.balance > amount) {
        resolve("Solde suffisant"); 
      } else {
        reject("Solde insuffisant"); 
      }
    }, 3000);
  });
}


function updateSolde(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      expediteur.wallet.balance -= amount;
      destinataire.wallet.balance += amount;
      resolve("Mise à jour du solde effectuée"); 
    }, 200);
  });
}


function addtransactions(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      
      const credit = {
        id: Date.now(),
        type: "credit",
        amount: amount,
        date: new Date().toLocaleString(),
        from: expediteur.name,
      };

      
      const debit = {
        id: Date.now(),
        type: "debit",
        amount: amount,
        date: new Date().toLocaleString(),
        to: destinataire.name,
      };

      expediteur.wallet.transactions.push(debit);
      destinataire.wallet.transactions.push(credit);

      resolve("Transaction ajoutée avec succès"); 
    }, 3000);
  });
}


function transfer(expediteur, numcompte, amount) {//num du dest

  checkUser(numcompte)
    .then((destinataire) => {
      console.log("Étape 1  : Destinataire trouvé -", destinataire.name);
      return checkSolde(expediteur, amount)
        .then((soldeMessage) => {
          console.log("Étape 2  :", soldeMessage);
          return updateSolde(expediteur, destinataire, amount);
        })
        .then((updateMessage) => {
          console.log("Étape 3  :", updateMessage);
          return addtransactions(expediteur, destinataire, amount);
        })
        .then((addTransactionMessage) => {
          console.log("Étape 4  :", addTransactionMessage);
          console.log(" Virement effectué avec succès !");
          renderDashboard(); // on rafraîchit l'affichage
          closeTransfer();   // on ferme le popup
        });
    })
    .catch((erreur) => {
      
      console.log(" Erreur :", erreur);
      alert("Erreur : " + erreur);
    });
}

function handleTransfer(e) {
  e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const beneficiaryAccount = findbeneficiarieByid(user.id, beneficiaryId).account;
  const sourceCard = document.getElementById("sourceCard").value;
  const amount = Number(document.getElementById("amount").value);

  transfer(user, beneficiaryAccount, amount);
}