fn main(
    seller: pub Field,
    buyer: pub Field,
    face_amount: pub u64,
    due_date: pub u64,
    qty: [u64; 5],
    unit_price: [u64; 5],
    text_hash: Field,
    salt: Field,
) -> pub Field {
    assert(face_amount > 0);

    let mut total = 0;
    for i in 0..5 {
        assert(qty[i] <= 1_000_000);
        assert(unit_price[i] <= 10_000_000_000);
        total += qty[i] * unit_price[i];
    }
    assert_eq(total, face_amount);

    std::hash::pedersen_hash([
        seller,
        buyer,
        face_amount as Field,
        due_date as Field,
        qty[0] as Field,
        qty[1] as Field,
        qty[2] as Field,
        qty[3] as Field,
        qty[4] as Field,
        unit_price[0] as Field,
        unit_price[1] as Field,
        unit_price[2] as Field,
        unit_price[3] as Field,
        unit_price[4] as Field,
        text_hash,
        salt,
    ])
}

#[test]
fn itemized_total_matches_public_amount() {
    let commitment = main(
        1,
        2,
        50,
        1_800_000_000,
        [2, 3, 0, 0, 0],
        [10, 10, 0, 0, 0],
        123,
        456,
    );
    assert(commitment != 0);
}

#[test]
fn private_rows_change_the_commitment() {
    let first = main(1, 2, 50, 1_800_000_000, [2, 3, 0, 0, 0], [10, 10, 0, 0, 0], 123, 456);
    let second = main(1, 2, 50, 1_800_000_000, [1, 4, 0, 0, 0], [22, 7, 0, 0, 0], 123, 456);
    assert(first != second);
}
