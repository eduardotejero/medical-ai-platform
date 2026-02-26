INSERT INTO patients (patient_code, age, gender) VALUES
('PT-0001', 34, 'F'),
('PT-0002', 45, 'M'),
('PT-0003', 28, 'F'),
('PT-0004', 52, 'M'),
('PT-0005', 31, 'F');

INSERT INTO clinical_data (patient_id, ige_total, eosinophils, skin_ph, tewl) VALUES
(1, 284.3, 8.2, 5.8, 32.1),
(2, 142.1, 4.5, 6.1, 18.4),
(3, 521.7, 12.3, 5.2, 45.6),
(4, 89.4, 2.1, 6.8, 12.3),
(5, 367.2, 9.8, 5.5, 38.9);

INSERT INTO diagnoses (patient_id, diagnosis, severity, confidence) VALUES
(1, 'Atopic Dermatitis', 3, 0.87),
(2, 'Psoriasis', 2, 0.92),
(3, 'Atopic Dermatitis', 4, 0.91),
(4, 'Contact Allergy', 1, 0.95),
(5, 'Urticaria', 3, 0.88);