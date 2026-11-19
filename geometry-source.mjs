// Canonical build-time geometry. Runtime consumers use assets/thread-geometry.js.
// Narrative order: side-view brain, eye, people, contexts, integration, table, gear.
export const sampleCounts = { narrative: 1600, bulb: 240, values: 280 };

// Broad, interwoven folds traced by hand from the user's uploaded reference.
// Author in reference-image coordinates, then fit the same 768×640 stage.
const brainReference = 'M1030 896 C1015 774 1120 824 1187 765 C1300 679 1050 650 1000 654 C800 629 922 793 989 893 C1060 1000 895 920 855 792 C792 615 739 750 602 731 C489 713 534 594 423 585 C290 585 197 567 216 417 C224 346 271 283 330 299 C329 216 453 126 564 158 C591 50 738 58 792 146 C812 43 1007 76 1015 158 C1015 198 968 265 919 264 C858 264 863 198 924 174 C952 163 982 157 1015 158 C1146 148 1171 209 1184 246 C1197 282 1266 292 1240 377 C1310 386 1331 519 1311 564 C1298 614 1235 624 1193 626 C1088 642 1054 580 1031 552 C984 497 948 547 909 587 C836 653 774 604 809 548 C846 491 953 490 1008 447 C1080 390 1001 295 1047 273 C1108 241 1141 280 1134 325 C1118 451 1235 370 1240 377 C1235 438 1135 466 1095 493 C1055 540 1108 543 1148 525 C1236 481 1268 539 1254 607 C1228 708 1027 849 919 755 C824 709 814 651 764 631 C676 574 615 716 561 650 C474 538 791 472 909 425 C1043 365 884 284 828 366 C765 443 690 399 721 339 C755 281 828 288 800 182 C797 169 795 157 792 146 C738 58 591 50 564 158 C559 168 562 178 565 188 C573 243 615 327 569 351 C515 384 474 338 498 285 C544 177 452 204 410 266 C358 344 329 293 330 299 C318 368 415 378 454 387 C530 405 520 450 469 455 C392 468 345 380 303 432 C261 499 344 516 394 516 C497 520 575 522 633 488 C689 454 607 375 641 306 C671 244 729 220 691 180 C664 143 617 174 565 158';
let referenceCoordinate = 0;
const brain = brainReference.replace(/-?\d+(?:\.\d+)?/g, value => (Number(value) * .44 + (referenceCoordinate++ % 2 ? 90 : 46)).toFixed(2));

export const narrativePaths = [
  brain,
  // Almond-shaped eye and iris share a continuous contour; the upper lid is
  // retraced to enter/leave the iris without a radial connector across the eye.
  'M60 318 H126 C196 238 273 205 384 205 C495 205 572 238 642 318 C572 398 495 431 384 431 C273 431 196 398 126 318 C196 238 273 205 384 205 C446 205 497 256 497 318 C497 380 446 431 384 431 C322 431 271 380 271 318 C271 256 322 205 384 205 C495 205 572 238 642 318 H710',
  'M55 510 L100 510 L113 372 Q115 340 143 326 L150 305 Q125 293 125 265 Q125 233 155 230 Q189 228 190 261 Q192 287 172 303 L179 327 Q206 339 213 369 L229 449 L245 510 L291 510 L310 320 Q314 291 346 281 L351 256 Q326 243 326 213 Q326 178 360 175 Q396 173 398 210 Q400 239 377 256 L384 282 Q417 291 423 325 L442 510 L492 510 L506 365 Q509 336 537 326 L544 305 Q520 290 523 264 Q526 231 558 233 Q590 234 591 266 Q590 291 568 305 L574 328 Q608 339 615 372 L636 510 L710 510',
  'M45 482 H102 V366 H137 V307 H184 V365 H207 V482 H233 V245 H250 V215 H269 V183 H287 V215 H309 V245 H326 V482 H349 V328 H374 V287 H412 V329 H435 V482 H459 V209 H480 V157 H499 V209 H520 V482 H542 V352 H564 V310 H602 V353 H625 V482 H711',
  'M45 370 C119 370 155 283 214 243 C288 192 358 190 430 223 C504 257 552 329 518 384 C488 432 410 429 367 390 C316 343 329 261 385 233 C448 202 510 244 518 296 C529 368 450 411 373 416 C294 421 216 385 206 330 C196 274 241 232 294 243 C356 255 379 323 350 370 C316 423 251 432 210 397 C153 348 186 275 248 265 C318 254 391 292 442 349 C501 416 559 427 620 389 C653 368 676 370 711 370'
];

// Do not length-resample these parametric outlines: matching
// indices must map each chair to its tooth, including repeated vertices.
export function radialShape(gear) {
  const count = sampleCounts.narrative;
  const points = [];
  const center = [384, 318];
  const at = (a, r, tangent = 0) => [center[0] + Math.cos(a) * r - Math.sin(a) * tangent, center[1] + Math.sin(a) * r + Math.cos(a) * tangent];
  const segment = (from, to, n) => { for (let j = 0; j < n; j++) { const t = j / n; points.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]); } };
  const sector = Math.PI / 4, width = .17;
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * sector;
    for (let j = 0; j < 18; j++) points.push(at(a - sector / 2 + (sector / 2 - width) * j / 18, 145));
    if (gear) {
      // Preserve the approved gear exactly, including its index correspondence.
      const tooth = [at(a - width, 145), at(a - width, 145), at(a - width, 184), at(a - width, 184), at(a - width, 184), at(a + width, 184), at(a + width, 184), at(a + width, 145), at(a + width, 145), at(a + width, 145)];
      for (let k = 0; k < tooth.length - 1; k++) segment(tooth[k], tooth[k + 1], 8);
    } else {
      // D-shaped chairs: a flat seat 5 units from the rim and a semicircular
      // back. The same 72 points per sector still become the matching tooth.
      segment(at(a - width, 145), at(a, 145), 8);
      segment(at(a, 145), at(a, 150), 8);
      segment(at(a, 150), at(a, 150, -28), 8);
      for (let j = 0; j < 24; j++) {
        const phi = Math.PI * j / 24;
        points.push(at(a, 150 + 28 * Math.sin(phi), -28 * Math.cos(phi)));
      }
      segment(at(a, 150, 28), at(a, 150), 8);
      segment(at(a, 150), at(a, 145), 8);
      segment(at(a, 145), at(a + width, 145), 8);
    }
    for (let j = 0; j < 18; j++) points.push(at(a + width + (sector / 2 - width) * j / 18, 145));
  }
  const startAngle = -Math.PI / 2 - sector / 2;
  const ringStart = at(startAngle, 145);
  points.push(ringStart);
  return Array.from({ length: count }, (_, i) => {
    const x = i * (points.length - 1) / (count - 1), n = Math.floor(x), t = x - n;
    const p = points[n], q = points[Math.min(n + 1, points.length - 1)];
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  });
}

export const bulbPaths = {
  // The initial bulb path is also the HTML fallback; app.js uses sampled points.
  from: 'M10 190 C70 190 85 190 110 190 C135 190 135 160 155 160 C180 160 180 220 205 220 C230 220 240 190 290 190',
  to: 'M10 275 H115 Q125 275 125 265 V225 C125 204 95 194 86 161 C69 99 104 49 150 49 C196 49 231 99 214 161 C205 194 175 204 175 225 V241 H125 V253 H175 V265 H135 Q150 290 165 265 H290'
};

// Manifesto d/data-target pairs from about.html, in document order.
export const valuePaths = {
  contaminazione: {
    from: 'M25 80C160 80 340 80 475 80C495 80 495 140 475 140C340 140 160 140 25 140C5 140 5 200 25 200C160 200 340 200 475 200',
    to: 'M25 140C100 140 120 45 200 65S290 220 365 185S430 100 475 140C405 210 315 220 250 140S110 60 25 140C100 220 175 225 250 140S400 65 475 140'
  },
  curiosita: {
    from: 'M25 215H200C220 215 225 200 225 185V155C225 130 290 130 290 90C290 35 200 35 195 90C192 110 210 120 225 110C245 95 245 75 265 85C285 100 255 120 245 135V175C245 195 245 215 270 215H475',
    to: 'M25 140C130 20 370 20 475 140C370 260 130 260 25 140C110 75 180 65 250 65C310 65 330 110 315 150C300 205 215 220 185 165C160 120 190 75 230 75C280 75 300 115 280 150C260 183 215 165 220 135C224 110 260 110 260 135C260 155 240 155 245 140C290 100 375 100 475 140'
  },
  rigore: {
    from: 'M25 140H475',
    to: 'M25 240H112L209 169C178 138 178 87 209 56C240 25 291 25 322 56C353 87 353 138 322 169C291 200 240 200 209 169L125 253L112 240L198 154'
  },
  concretezza: {
    from: 'M25 195C100 195 90 100 160 100S200 235 270 205S300 70 375 85S420 185 475 185',
    to: 'M25 235H65V135H115V85H305V135H435V235H65V185H435H335V235V185H245V235V185H155V235V185H65V135H110V185V135H200V185V135H290V185V135H380V185V135H305H210V85'
  }
};
