/**
 * Google Apps Script — приём заявок с сайта факультета ИИ в Google-таблицу.
 *
 * Таблица: https://docs.google.com/spreadsheets/d/1QXnXXSfA2s-pzLg37R-YbUTCI_k_MCKq4uEmfpCCvVg/edit
 *
 * Как подключить (подробнее в FORM-SETUP.md):
 *   1. Откройте таблицу → Расширения → Apps Script.
 *   2. Вставьте этот код, сохраните.
 *   3. Развернуть → Новое развёртывание → тип «Веб-приложение».
 *        - Запуск от имени: «Я».
 *        - У кого есть доступ: «Все».
 *   4. Скопируйте URL вида https://script.google.com/macros/s/.../exec
 *      и вставьте его в script.js → const APPLY_ENDPOINT.
 *
 * ВНИМАНИЕ (152-ФЗ). Серверы Google находятся за пределами Российской Федерации,
 * поэтому приём персональных данных граждан РФ напрямую в Google-таблицу нарушает
 * требование о локализации баз данных (ч. 5 ст. 18 152-ФЗ) и является трансграничной
 * передачей без уведомления Роскомнадзора (ст. 12 152-ФЗ). Этот скрипт оставлен как
 * временное решение и дополнен фиксацией согласия; постоянный приёмник заявок должен
 * быть развёрнут на российском хостинге. Подробности и план миграции — в COMPLIANCE.md.
 */

var SPREADSHEET_ID = '1QXnXXSfA2s-pzLg37R-YbUTCI_k_MCKq4uEmfpCCvVg';
var SHEET_NAME = 'Заявки';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Без согласия обработка персональных данных неправомерна (ч. 1 ст. 6 152-ФЗ):
    // такие заявки не записываем вообще, даже если запрос дошёл в обход формы.
    if (data.consent !== true) {
      return jsonOutput_({ result: 'error', message: 'consent required' });
    }

    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      data.name || '',
      data.phone || '',
      data.email || '',
      data.page || '',
      'Да',
      data.consentAt || '',
      data.consentVersion || '',
      data.marketingConsent === true ? 'Да' : 'Нет',
      data.consentText || '',
    ]);
    return jsonOutput_({ result: 'ok' });
  } catch (err) {
    return jsonOutput_({ result: 'error', message: String(err) });
  }
}

function doGet() {
  return jsonOutput_({ result: 'ok', service: 'fii-apply-form' });
}

function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Дата', 'ФИО', 'Телефон', 'Email', 'Страница',
      'Согласие на обработку ПДн', 'Дата согласия', 'Версия согласия',
      'Согласие на рассылку', 'Текст согласия',
    ]);
  }
  return sheet;
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
