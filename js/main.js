$(function() {
    var companies = new Array();
    var total_price = 0.0;

    $('#ready').hide();

    // Get all companies
    $.ajax({
        type: "GET",
        url: "/companies_api",
        success: function(data) {
            $.each(data, function(i, company) {
                console.log(company.name);
                var temp = {
                    'name': company.name,
                    'price': company.price,
                    'change': company.change,
                    'change_percentage': company.change_percentage
                };
                companies.push(temp);

                // Print company data unto table
                $('#summary').append(
                    '<tr>' +
                    '<td>' + company.name + '</td>' +
                    '<td id="price_' + company.name + '">' + company.price.toFixed(2) + '</td>' +
                    '<td>' + company.change + '</td>' +
                    '<td>' + company.change_percentage + '</td>' +
                    '</tr>'
                );

                $('#select_company').append(
                    '<option>' + company.name + '</option>'
                );
            });
        },
        dataType: 'json'
    });

    // Price update
    $('#select_company').change(function(event) {
        $.each(companies, function(i, company) {
            if (company.name == $('#select_company').val()) {
                $('#ready').show();
                $('#price').html("Price: " + company.price.toFixed(2));
            }
        });
    });

    $('#quantity').keyup(function(event) {
        $.each(companies, function(i, company) {
            if (company.name == $('#select_company').val()) {
                total_price = company.price * $('#quantity').val();
                $('#total_price').html("Total price: " + total_price.toFixed(2));
            }
        });
    });

    $('#buy_btn').click(function() {
        $.ajax({
            type: "POST",
            url: "/buy_api",
            data: JSON.stringify({
                buy_details: {
                    'name': $('#select_company').val(),
                    'price': total_price,
                    'quantity': $('#quantity').val()
                }
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(company){
                $('#price_' + company.name).html(company.price.toFixed(2));
            },
            failure: function(err) {
                alert(err);
            }
        });
    });

});
