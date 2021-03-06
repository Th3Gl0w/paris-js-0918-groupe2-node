const moment = require("moment");
const axios = require("axios");
moment().format();

// DONNEES CONCERNANT UNE FACTURE SPECIFIQUE (A RECUP DE LA BDD)


const facture = {
  montant_ttc: 10268,
  echeance_facture: "12/09/2011"
};

// const mesAcomptes = [
//   acompte1 = {
//     montant_ttc: 100
//   },
//   acompte2 = {
//     montant_ttc: 100
//   }
// ];

// const mesAvoirs = [
//   avoir1 = {
//     montant_ttc: 30
//   },
//   avoir2 = {
//     montant_ttc: 38
//   }
// ];
const mesAcomptes = [];
const mesAvoirs = [];

// let facture;
const truc = async () => {
  const test = await axios.get("http://localhost:4848/api/factures/16");
  const lesAcomptes = test.data.acomptes;
  const lesAvoirs = test.data.avoirs;

  const acompte = "acompte";
  const avoir = "avoir";

  lesAcomptes.map((e, i) =>
    mesAcomptes.push({
      [acompte + i]: {
        montant_ttc: e.montant_ttc
      }
    })
  );

  lesAvoirs.map((e, i) =>
    mesAvoirs.push({
      [avoir + i]: {
        montant_ttc: e.montant_ttc
      }
    })
  );

  //    facture = {
  //     montant_ttc: 10268,
  //     echeance_facture: "12/09/2011"
  //   }
  // console.log(JSON.stringify(test.data.date_facture))
  //   return facture
};
truc();


// console.log(facture)

// DATE DE FIN DE CALCUL DES INTERETS PAR FACTURE (A RECUP DE LA BDD)
const dateFinCalculInterets = "20/05/2013";

// POINTS EN % A RAJOUTER AU TAUX DE LA BCE
const points = 10; //a passer a la main

const getTotalCreance = (facture, acomptes, avoirs) => {
  let montantFacture = facture.montant_ttc;
  let montantAvoir = 0;
  for (let i = 0; i < avoirs.length; i++) {
    montantAvoir += avoirs[i].montant_ttc;
  }
  let montantAcompte = 0;
  for (let i = 0; i < acomptes.length; i++) {
    montantAcompte += acomptes[i].montant_ttc;
  }
  let totalCreance = montantFacture - montantAvoir - montantAcompte;
  return totalCreance;
};

const totalCreance = getTotalCreance(facture, mesAcomptes, mesAvoirs);

const getDateRangesWithInterestRates = (startDate, endDate) => {
  let depart_echeance = moment(startDate, "DD/MM/YYYY", true).add(1, "days");
  // add 1 day parce que date de calcul des interets commence le lendemain de la date d'echeance
  let fin_echeance = moment(endDate, "DD/MM/YYYY", true);

  let nbreAnneesDifferences = fin_echeance.diff(depart_echeance, "year");
  let nbreJoursInterets = fin_echeance.diff(depart_echeance, "days") + 1;
  // + 1 parce que le .diff de moments ne prends pas en compte le jour de depart dans le calcul entre deux dates

  let regexAnnee = /(\d){4}/g;
  let anneeDepart = parseInt(startDate.match(regexAnnee));
  let anneeFin = parseInt(endDate.match(regexAnnee));
  let mesAnnees = [anneeFin];
  for (let i = 1; i < nbreAnneesDifferences + 1; i++) {
    mesAnnees.push(anneeFin - i);
  }

  let AnneesAvecJoursParSemestres = [];

  for (let i = 0; i < mesAnnees.length; i++) {
    let semestreUnDepart = moment(`01/01/${mesAnnees[i]}`, "DD/MM/YYYY", true);
    let semestreUnFin = moment(`30/06/${mesAnnees[i]}`, "DD/MM/YYYY", true);
    let semestreDeuxDepart = moment(
      `01/07/${mesAnnees[i]}`,
      "DD/MM/YYYY",
      true
    );
    let semestreDeuxFin = moment(`31/12/${mesAnnees[i]}`, "DD/MM/YYYY", true);
    let nbreJoursSemestreUn = semestreUnFin.diff(semestreUnDepart, "days") + 1;
    let nbreJoursSemestreDeux =
      semestreDeuxFin.diff(semestreDeuxDepart, "days") + 1;
    let nbreJoursAnnee = nbreJoursSemestreUn + nbreJoursSemestreDeux;

    AnneesAvecJoursParSemestres.push({
      annee: mesAnnees[i],
      joursSemestre1: nbreJoursSemestreUn,
      joursSemestre2: nbreJoursSemestreDeux,
      nbreJourAnnee: nbreJoursAnnee
    });
  }
  AnneesAvecJoursParSemestres.push({
    nbreJoursInterets: nbreJoursInterets,
    dateDepart: depart_echeance,
    dateFin: fin_echeance
  });
  //   console.log(AnneesAvecJoursParSemestres);
  return AnneesAvecJoursParSemestres;
};

const getDateRangesWithInterestRatesMulti = (startDate, endDate) => {
  let depart_echeance = moment(startDate, "DD/MM/YYYY", true);

  if (facture.echeance_facture === startDate) {
    depart_echeance.add(1, "days");
  }

  let fin_echeance = moment(endDate, "DD/MM/YYYY", true);

  let nbreAnneesDifferences = 0; // fin_echeance.diff(depart_echeance, "year");
  let nbreJoursInterets = fin_echeance.diff(depart_echeance, "days") + 1;
  // + 1 parce que le .diff de moments ne prends pas en compte le jour de depart dans le calcul entre deux dates

  let regexAnnee = /(\d){4}/g;
  let anneeDepart = parseInt(startDate.match(regexAnnee));
  let anneeFin = parseInt(endDate.match(regexAnnee));
  let mesAnnees = [anneeFin];

  let AnneesAvecJoursParSemestres = [];

  for (let i = 0; i < mesAnnees.length; i++) {
    let semestreUnDepart = moment(`01/01/${mesAnnees[i]}`, "DD/MM/YYYY", true);
    let semestreUnFin = moment(`30/06/${mesAnnees[i]}`, "DD/MM/YYYY", true);
    let semestreDeuxDepart = moment(
      `01/07/${mesAnnees[i]}`,
      "DD/MM/YYYY",
      true
    );
    let semestreDeuxFin = moment(`31/12/${mesAnnees[i]}`, "DD/MM/YYYY", true);
    let nbreJoursSemestreUn = semestreUnFin.diff(semestreUnDepart, "days") + 1;
    let nbreJoursSemestreDeux =
      semestreDeuxFin.diff(semestreDeuxDepart, "days") + 1;
    let nbreJoursAnnee = nbreJoursSemestreUn + nbreJoursSemestreDeux;

    AnneesAvecJoursParSemestres.push({
      annee: mesAnnees[i],
      joursSemestre1: nbreJoursSemestreUn,
      joursSemestre2: nbreJoursSemestreDeux,
      nbreJourAnnee: nbreJoursAnnee
    });
  }
  AnneesAvecJoursParSemestres.push({
    nbreJoursInterets: nbreJoursInterets,
    dateDepart: depart_echeance,
    dateFin: fin_echeance
  });
  //   console.log(AnneesAvecJoursParSemestres);
  return AnneesAvecJoursParSemestres;
};

const nbreJoursInterets = getDateRangesWithInterestRates(
  facture.echeance_facture,
  dateFinCalculInterets
);

const getBCErates = (startDate, endDate) => {
  return axios
    .get(
      `https://sdw-wsrest.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.MRR_FR.LEV?startPeriod=${startDate}&endPeriod=${endDate}`,
      { headers: { Accept: "application/json" } }
    )
    .then(
      res => res.data.dataSets[0].series["0:0:0:0:0:0:0"].observations[0][0]
    );
};

const getCalculInteretsParSemestre = async (
  totalCreance,
  nbreJoursInterets,
  totalJoursAnnee,
  annee,
  semestre,
  points,
  debut,
  fin
) => {
  const calculInterets = [];
  let mySemestre;
  if (semestre === 1) {
    mySemestre = "-01-01";
  } else if (semestre === 2) {
    mySemestre = "-07-01";
  }

  await getBCErates(`${annee}${mySemestre}`, `${annee}${mySemestre}`).then(
    res => {
      let jourSurAnnee = nbreJoursInterets / totalJoursAnnee;
      let tauxBCEEtPoint = (res + points) / 100;
      let calcul_interets_periode =
        totalCreance * jourSurAnnee * tauxBCEEtPoint;
      calculInterets.push({
        date_debut: debut.format("DD/MM/YYYY"),
        date_fin: fin.format("DD/MM/YYYY"),
        nbre_jours_comptabilises: nbreJoursInterets,
        interets_periode: calcul_interets_periode,
        taux_interet_applique: res
      });
    }
  );
  return calculInterets;
};

const getCalculInteretsParAnnee = async (
  totalCreance,
  nbreJoursInterets,
  totalJoursAnnee,
  annee,
  semestre,
  points,
  debut,
  fin
) => {
  const calculInterets = [];
  let mySemestre;
  if (semestre === 1) {
    mySemestre = "-01-01";
  } else if (semestre === 2) {
    mySemestre = "-07-01";
  }

  await getBCErates(`${annee}${mySemestre}`, `${annee}${mySemestre}`).then(
    res => {
      let jourSurAnnee = (nbreJoursInterets + 1) / totalJoursAnnee;
      let tauxBCEEtPoint = (res + points) / 100;
      let calcul_interets_periode =
        totalCreance * jourSurAnnee * tauxBCEEtPoint;
      calculInterets.push({
        date_debut: debut.format("DD/MM/YYYY"),
        date_fin: fin.format("DD/MM/YYYY"),
        nbre_jours_comptabilises: nbreJoursInterets + 1,
        interets_periode: calcul_interets_periode,
        taux_interet_applique: res
      });
    }
  );
  return calculInterets;
};

const getCalculInteretsTotal = async (debut, fin) => {
  let finalResult = [];
  let debutMultiAnnees = moment(facture.echeance_facture, "DD/MM/YYYY", true);
  let finMultiAnnees = moment(dateFinCalculInterets, "DD/MM/YYYY", true);
  let anneeDebutMultiAnnees = parseInt(debutMultiAnnees.format("YYYY"));
  let anneeFinMultiAnnees = parseInt(finMultiAnnees.format("YYYY"));

  if (anneeDebutMultiAnnees !== anneeFinMultiAnnees) {
    let nbreAnneesDifferences =
      finMultiAnnees.diff(debutMultiAnnees, "year") + 1;
    let mesAnnees = [anneeFinMultiAnnees];

    for (let i = 1; i < nbreAnneesDifferences + 1; i++) {
      mesAnnees.push(anneeFinMultiAnnees - i);
    }

    // console.log(mesAnnees);

    let calculMultiAnnees = [];

    for (let i = 0; i < mesAnnees.length; i++) {
      let dateDebut = "";
      let dateFin = "";
      let regExJours = /(\d{2})\//g;
      let joursDebut = facture.echeance_facture.match(regExJours).join("");
      let joursFin = dateFinCalculInterets.match(regExJours).join("");

      if (anneeFinMultiAnnees === mesAnnees[i]) {
        let annee = mesAnnees[i].toString();
        dateDebut = `01/01/${annee}`;
        dateFin = `${joursFin}${annee}`;
        // console.log(getDateRangesWithInterestRatesMulti(dateDebut, dateFin));
        // console.log("annee fin", mesAnnees[i]);
        calculMultiAnnees.push(
          getDateRangesWithInterestRatesMulti(dateDebut, dateFin)
        );
      } else if (
        anneeDebutMultiAnnees !== mesAnnees[i] &&
        anneeFinMultiAnnees !== mesAnnees[i]
      ) {
        let annee = mesAnnees[i].toString();
        dateDebut = `01/01/${annee}`;
        dateFin = `31/12/${annee}`;
        // console.log("annee milieu", mesAnnees[i]);
        calculMultiAnnees.push(
          getDateRangesWithInterestRatesMulti(dateDebut, dateFin)
        );
      } else if (anneeDebutMultiAnnees === mesAnnees[i]) {
        let annee = mesAnnees[i].toString();
        dateDebut = `${joursDebut}${annee}`;
        dateFin = `31/12/${annee}`;
        // console.log("annee debut", mesAnnees[i]);
        // console.log(dateDebut, dateFin);
        calculMultiAnnees.push(
          getDateRangesWithInterestRatesMulti(dateDebut, dateFin)
        );
      }
    }

    let combienAnnees = calculMultiAnnees.length;
    // console.log(calculMultiAnnees);

    for (let i = 0; i < combienAnnees; i++) {
      let debut = calculMultiAnnees[i][1].dateDepart;
      let fin = calculMultiAnnees[i][1].dateFin;

      let anneeDebut = parseInt(debut.format("YYYY"));
      let anneeFin = parseInt(fin.format("YYYY"));

      let finSemestre1 = moment(`30/06/${anneeDebut}`, "DD/MM/YYYY", true);
      let finSemestre2 = moment(`31/12/${anneeDebut}`, "DD/MM/YYYY", true);

      let debutSemestre2 = moment(`01/07/${anneeDebut}`, "DD/MM/YYYY", true);

      let nbreJoursSemestre1 = finSemestre1.diff(debut, "days");
      let nbreJoursSemestre2 = fin.diff(debutSemestre2, "days");

      let moisDebut = parseInt(debut.format("MM"));
      let moisFin = parseInt(fin.format("MM"));
      let semestre = 0;

      // console.log(nbreJoursInterets[1].nbreJoursInterets);
      // console.log(nbreJoursInterets[0].annee);

      // console.log(calculMultiAnnees[i][0].nbreJourAnnee);
      // console.log(calculMultiAnnees[i][1].nbreJoursInterets);

      // si creance sur un seul semestre

      if (moisDebut < 7 && moisFin < 7) {
        semestre = 1;
        finalResult.push(
          await getCalculInteretsParSemestre(
            totalCreance,
            calculMultiAnnees[i][1].nbreJoursInterets,
            calculMultiAnnees[i][0].nbreJourAnnee,
            anneeDebut,
            semestre,
            points,
            debut,
            fin
          )
        );
      } else if (moisDebut > 6 && moisFin > 6) {
        semestre = 2;
        finalResult.push(
          await getCalculInteretsParSemestre(
            totalCreance,
            calculMultiAnnees[i][1].nbreJoursInterets,
            calculMultiAnnees[i][0].nbreJourAnnee,
            anneeDebut,
            semestre,
            points,
            debut,
            fin
          )
        );
      } else if (moisDebut < 7 && moisFin > 6) {
        semestre = 1;
        finalResult.push(
          await getCalculInteretsParAnnee(
            totalCreance,
            nbreJoursSemestre1,
            calculMultiAnnees[i][0].nbreJourAnnee,
            calculMultiAnnees[i][0].annee,
            semestre,
            points,
            debut,
            finSemestre1
          )
        );
        semestre = 2;
        finalResult.push(
          await getCalculInteretsParAnnee(
            totalCreance,
            nbreJoursSemestre2,
            calculMultiAnnees[i][0].nbreJourAnnee,
            calculMultiAnnees[i][0].annee,
            semestre,
            points,
            debutSemestre2,
            fin
          )
        );
      }
    }
  } else if (anneeDebutMultiAnnees === anneeFinMultiAnnees) {
    let anneeDebut = parseInt(debut.format("YYYY"));
    let anneeFin = parseInt(fin.format("YYYY"));
    let finSemestre1 = moment(`30/06/${anneeDebut}`, "DD/MM/YYYY", true);
    let finSemestre2 = moment(`31/12/${anneeDebut}`, "DD/MM/YYYY", true);
    let debutSemestre2 = moment(`01/07/${anneeDebut}`, "DD/MM/YYYY", true);
    let nbreJoursSemestre1 = finSemestre1.diff(debut, "days");
    let nbreJoursSemestre2 = fin.diff(debutSemestre2, "days");
    let moisDebut = parseInt(debut.format("MM"));
    let moisFin = parseInt(fin.format("MM"));
    let semestre = 0;
    // si creance sur un seul semestre
    if (moisDebut < 7 && moisFin < 7) {
      semestre = 1;
      finalResult.push(
        await getCalculInteretsParSemestre(
          totalCreance,
          nbreJoursInterets[1].nbreJoursInterets,
          nbreJoursInterets[0].nbreJourAnnee,
          anneeDebut,
          semestre,
          points,
          debut,
          fin
        )
      );
    } else if (moisDebut > 6 && moisFin > 6) {
      semestre = 2;
      finalResult.push(
        await getCalculInteretsParSemestre(
          totalCreance,
          nbreJoursInterets[1].nbreJoursInterets,
          nbreJoursInterets[0].nbreJourAnnee,
          anneeDebut,
          semestre,
          points,
          debut,
          fin
        )
      );
    } else if (moisDebut < 7 && moisFin > 6) {
      semestre = 1;
      finalResult.push(
        await getCalculInteretsParAnnee(
          totalCreance,
          nbreJoursSemestre1,
          nbreJoursInterets[0].nbreJourAnnee,
          nbreJoursInterets[0].annee,
          semestre,
          points,
          debut,
          finSemestre1
        )
      );
      semestre = 2;
      finalResult.push(
        await getCalculInteretsParAnnee(
          totalCreance,
          nbreJoursSemestre2,
          nbreJoursInterets[0].nbreJourAnnee,
          nbreJoursInterets[0].annee,
          semestre,
          points,
          debutSemestre2,
          fin
        )
      );
    }
  }
  return finalResult;
};

getCalculInteretsTotal(
  nbreJoursInterets[1].dateDepart,
  nbreJoursInterets[1].dateFin
).then(res => console.log(res));

module.exports = {
  getCalculInteretsTotal

};

}
