<?php

/* 
 * Copyright (C) 2015 Nathan Crause - All rights reserved
 *
 * This file is part of DOSO
 *
 * Copying, modification, duplication in whole or in part without
 * the express written consent of the copyright holder is
 * expressly prohibited under the Berne Convention and the
 * Buenos Aires Convention.
 */

require_once '../common/core.php';
require_once '../common/connect.php';
require_once '../common/sessioncheck.php';

$template = filter_input(INPUT_POST, 'template');
$args = [
	'id.id'		=> filter_input(INPUT_POST, 'id')
];

require_once '../common/process_template.php';
