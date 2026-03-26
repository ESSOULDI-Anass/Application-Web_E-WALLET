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

//===================recharger=========================
const topupPopup       = document.getElementById('topupPopup');
const quickTopupBtn    = document.getElementById('quickTopup');
const closeTopupBtn    = document.getElementById('closeTopupBtn');
const cancelTopupBtn   = document.getElementById('cancelTopupBtn');
const topupForm        = document.getElementById('topupForm');
const topupCardSelect  = document.getElementById('topupCard');
const topupAmountInput = document.getElementById('topupAmount');

quickTopupBtn .addEventListener('click', openTopupPopup);
closeTopupBtn .addEventListener('click', closeTopupPopup);
cancelTopupBtn.addEventListener('click', closeTopupPopup);
topupPopup    .addEventListener('click', (e) => { if (e.target === topupPopup) closeTopupPopup(); });


function openTopupPopup() {
  topupPopup.classList.add('active');
  document.body.classList.add('popup-open');
}


user.wallet.cards.forEach((card) => {
  const option = document.createElement('option');
  option.value = card.numcards;
  option.textContent = card.type + ' ****' + card.numcards;
  topupCardSelect.appendChild(option);
});


function closeTopupPopup() {
  topupPopup.classList.remove('active');
  document.body.classList.remove('popup-open');
}




function validateAmount(amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!amount || isNaN(amount)) {
        reject("Montant invalide ou vide.");
      } else if (amount <= 0) {
        reject("Le montant doit être supérieur à zéro.");
      } else if (amount < 10) {
        reject("Le montant minimum est de 10 MAD.");
      } else if (amount > 10000) {
        reject("Le montant maximum est de 10 000 MAD.");
      } else {
        resolve(amount);
      }
    }, 500);
  });
}

function validateCard(numcards) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const card = user.wallet.cards.find((c) => c.numcards === numcards);

      if (!card) {
        reject("Moyen de paiement introuvable.");
        return;
      }

      // Vérifier si la carte est expirée (format MM/YY)
      const [year,month,day] = card.expiry.split("-");
      const expiryDate = new Date(year, month - 1, day);
      const today = new Date();

      if (expiryDate < today) {
        reject(`La carte **** ${card.numcards} est expirée.`);
        return;
      }

      resolve(card);
    }, 500);
  });
}

function processTopup(card, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      
        user.wallet.balance += amount;
        resolve({ card, amount });
     
    }, 1000);
  });
}


function saveTopupTransaction(card, amount, status) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const transaction = {
        id: Date.now(),
        type: "RECHARGE",
        amount: amount,
        date: new Date().toLocaleString(),
        from: `Carte ****` +card.numcards,
        status: status, 
      };

      user.wallet.transactions.push(transaction);
      resolve(transaction);
    }, 500);
  });
}


function topup(numcards, amount) {
  validateAmount(amount)
    .then((validAmount) => {
      console.log("Étape 1 : Montant valide —", validAmount, "MAD");
      return validateCard(numcards);
    })
    .then((card) => {
      console.log("Étape 2 : Carte valide —", card.type, "****", card.numcards);
      return processTopup(card, amount);
    })
    .then(({ card, amount }) => {
      console.log("Étape 3 : Solde mis à jour —", user.wallet.balance, "MAD");
      return saveTopupTransaction(card, amount, "success");
    })
    .then((transaction) => {
      console.log("Étape 4 : Transaction enregistrée —", transaction);
      console.log("Rechargement effectué avec succès !");
      renderDashboard();   // votre fonction existante
      closeTopupPopup();
      alert(` Rechargement de ${amount} MAD effectué avec succès !`);
    })
    .catch((erreur) => {
      console.log("Erreur :", erreur);
      
      const card = user.wallet.cards.find((c) => c.numcards === numcards);
      if (card) {
        saveTopupTransaction(card, amount, "failed");
      }
      alert("Erreur : " + erreur);
    });
}

topupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const numcards = topupCardSelect.value;
  const amount   = parseFloat(topupAmountInput.value);
  topup(numcards, amount);
});