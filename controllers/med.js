const models = require("../models");
const JSZip = require("jszip");
const Docxtemplater = require("docxtemplater");

const fs = require("fs");
const fsPromises = fs.promises;

const path = require("path");

module.exports = {
  createMed: (req, res) => {
    models.action
      .findByPk(req.params.id, {
        include: [
          { model: models.creancier },
          { model: models.debiteur },
          {
            model: models.facture,
            include: [{ model: models.acompte }, { model: models.avoir }]
          }
        ]
      })
      .then(result => {
        // Algo de calcul + concat de result
        // then => Generation de document

        //Load the docx file as a binary
        fsPromises
          .readFile(
            path.resolve(
              __dirname,
              "../docxtemplating/matrice_mise_en_demeure.docx"
            ),
            "binary"
          )
          .then(content => {
            const zip = new JSZip(content);

            const doc = new Docxtemplater();
            doc.loadZip(zip);

            //set today's date
            let today = new Date();
            let dd = today.getDate();
            let mm = today.getMonth() + 1; // january is 0...
            let yyyy = today.getFullYear();

            if (dd < 10) {
              dd = "0" + dd;
            }
            if (mm < 10) {
              mm = "0" + mm;
            }

            today = dd + "/" + mm + "/" + yyyy; // date for the word document
            today_file = dd + "-" + mm + "-" + yyyy; // date for the file name

            doc.setData({
              denomination_sociale_debiteur:
                result.debiteur.denomination_sociale,
              forme_juridique_debiteur: result.debiteur.forme_juridique,
              isMale: result.debiteur.civilite == "M." ? true : false,
              isFemale: result.debiteur.civilite == "Mme" ? true : false,
              prenom_representant_legal: result.debiteur.prenom,
              nom_representant_legal: result.debiteur.nom,
              fonction_representant_legal: result.debiteur.fonction,
              adresse_debiteur: result.debiteur.adresse_siege,
              code_postal_debiteur: result.debiteur.code_postal_siege,
              ville_debiteur: result.debiteur.ville_siege,
              date_mise_en_demeure: today,
              //   num_AR: "",
              denomination_sociale_creancier:
                result.creancier.denomination_sociale,
              nationalite_creancier: result.creancier.nationalite_societe,
              forme_juridique_creancier: result.creancier.forme_juridique,
              adresse_creancier: result.creancier.adresse_siege,
              code_postal_creancier: result.creancier.code_postal_siege,
              ville_creancier: result.creancier.ville_siege,
              pays_creancier: result.creancier.pays_siege,
              factures: result.factures.map(facture => {
                return {
                  numero_facture: facture.num_facture,
                  date_facture: facture.date_facture,
                  montant_facture_ht: facture.montant_ht,
                  montant_facture_ttc: facture.montant_ttc,
                  echeance_facture: facture.echeance_facture,
                  calcul_acomptes_payes: "",
                  calcul_solde_du: ""
                };
              }),
              avoirs: result.factures.map(element => {
                return element.avoirs.map(avoir => {
                  return {
                    numero_avoir: avoir.num_avoir,
                    date_avoir: avoir.date_avoir,
                    montant_avoir_ht: avoir.montant_ht,
                    montant_avoir_ttc: avoir.montant_ttc,
                    echeance_avoir: avoir.echeance_avoir,
                    calcul_acomptes_payes: "",
                    calcul_solde_du: ""
                  };
                });
              }),
              acomptes: result.factures.map(element => {
                return element.acomptes.map(acompte => {
                  return {
                  numero_acompte: acompte.num_acompte,
                  date_acompte: acompte.date_acompte,
                  acompte_ht: acompte.montant_ht,
                  acompte_ttc: acompte.montant_ttc,
                  calcul_acomptes_payes: "",
                  calcul_solde_du: ""
                  };
                });
              }),
              // produits_vendus: result.produits,
              // services_fournis: result.services,
              //   isProduits : result.produits == produits_vendus ? true : false,
              //   isServices : result.services == services_fournis ? true : false,
              calcul_creance_principale_HT: "",
              calcul_creance_principale_TTC: "",
              //   delai_paiement_facture: "Les factures devaient être payées à " + result.factures.echeance_facture,
              //   paiement_a_la_livraison: result.debiteur.denomination_sociale + "devait payer l’intégralité au plus tard à la livraison. Or, pour ne pas la mettre en difficulté, " + result.creancier.denomination_sociale + " lui a fait confiance et lui a",
              totalite_marchandise: "livré la totalite de la marchandise",
              totalite_prestation: "fourni la totalite des prestations",
              // isTotaliteMarchandise: result.produits == produits_vendus ? totalite_marchandise : false,
              // isTotalitePrestation: result.services == services_fournis ? totalite_prestation : false,
              entreprise_française:
                "En application de l’article L. 441-6 du Code de commerce,les factures impayées font courir des intérêts légaux au taux de refinancement de la BCE majoré de 10 points, à compter de leur date d’échéance sans qu’un rappel soit nécessaire, outre le paiement d’une indemnité forfaitairepour frais de recouvrement de quarante euros par facture impayée et le remboursement de tous autres frais complémentaires de recouvrement.",
              entreprise_italienne:
                "En application du décret législatif italien du 9 novembre 2012 n°192 y compris ses modifications ultérieures, les factures impayées font courir des intérêts légaux au taux de refinancement de la BCE majoré de 8 points, à compter de leur date d’échéance sans qu’un rappel soit nécessaire, outre le paiement d’une indemnité forfaitaire pour frais de recouvrement de quarante euros par facture impayée et le remboursement de tous autres frais complémentaires de recouvrement.",
              calcul_total_interets: "",
              //   isHonorairesHT: "",
              //   isHonorairesTTC: "",
              //   honoraires_HT: "",
              //   honoraires_TTC: "",
              calcul_total_creance_principale_HT: "",
              calcul_total_creance_principale_TTC: ""
            });

            // debtor's name for the filename
            let debiteur_filename = "";

            // creditor's name  for the filename
            let creancier_filename = "";

            try {
              // render the document
              doc.render();
            } catch (error) {
              const e = {
                message: error.mesage,
                name: error.name,
                stack: error.stack,
                properties: error.properties
              };
              console.log(JSON.stringify({ error: error }));
              throw error;
            }

            const buf = doc.getZip().generate({ type: "nodebuffer" });

            fsPromises
              .writeFile(
                path.resolve(
                  __dirname,
                  `../public/documents/${today_file} - Mise en demeure - ${creancier_filename} contre ${debiteur_filename}.docx`
                ),
                buf
              )
              .then(() =>
                res.send(
                  `${today_file} - Mise en demeure - ${creancier_filename} contre ${debiteur_filename}.docx`
                )
              )
              .catch(err => console.log(err));
          })
          .catch(err => console.log(err));

        //res.send(result);
      });
  }
};