<?php
// Zwei Dateien im Ordner «sites/» auf dem Infomaniak-Hosting (NICHT im Web-Ordner der Site):
//
// 1) sites/anfrage-config.php – einmal für alle Sites:
//      return ['RESEND_API_KEY' => 're_xxxxxxxxxxxxxxxxxxxx'];
//
// 2) sites/anfrage-config-<domain>.php – pro Site, z.B. anfrage-config-praxis-muster.ch.php:
return [
  'ANFRAGE_TO' => 'info@kunde.ch',
  // optional: 'ANFRAGE_FROM' => 'Website kunde.ch <formular@zbinden.online>',
];
