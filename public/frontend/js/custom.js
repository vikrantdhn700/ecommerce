$(document).ready(function()
{   
    if($('.bbb_viewed_slider').length)
    {
        var viewedSlider = $('.bbb_viewed_slider');

        viewedSlider.owlCarousel(
        {
            loop:true,
            margin:30,
            autoplay:true,
            autoplayTimeout:6000,
            nav:false,
            dots:false,
            responsive:
            {
                0:{items:1},
                575:{items:2},
                768:{items:3},
                991:{items:4},
                1199:{items:6}
            }
        });

        if($('.bbb_viewed_prev').length)
        {
            var prev = $('.bbb_viewed_prev');
            prev.on('click', function()
            {
                viewedSlider.trigger('prev.owl.carousel');
            });
        }

        if($('.bbb_viewed_next').length)
        {
            var next = $('.bbb_viewed_next');
            next.on('click', function()
            {
                viewedSlider.trigger('next.owl.carousel');
            });
        }
    }
});

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
  
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

document.querySelectorAll('.cart_form').forEach(item => {
    item.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.target.querySelector('button.add_to_cart').setAttribute('disabled', true);
    event.target.querySelector('button.add_to_cart').innerHTML= '<div class="spinner-border spinner-border-sm" text-light mr-2" role="status"></div>Add To cart';
        let formData = new FormData(item);
        formData = new URLSearchParams(formData);
        try{
            let response = await fetch(site_url+'/cart/add/', {
                method: 'POST',
                body : formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then((response)=> response.json())
            .then((data) => {
                if(data.status=="success"){
                    triggerAlert(data.message,'success');
                } else {
                    triggerAlert(data.message,'error');
                }
                event.target.querySelector('button').removeAttribute('disabled');
                event.target.querySelector('button').innerHTML= 'Add To Cart';
            });
        } catch(error) {
            console.log(error);
        }
    })
})

document.querySelectorAll('#cart_form_update').forEach(item => {
    item.addEventListener('submit', async (event) => {
        event.preventDefault();
        let qty = [];
        let product_id = [];        
        let qtyList = item.querySelectorAll('input[name="qty[]"]');
        let prodList = item.querySelectorAll('input[name="product_id[]"]');
        qtyList.forEach(function(row , index){
            qty[index] = row.value;
            product_id[index] = prodList[index].value;
        });
        let formData = new FormData()
        formData.append('qty', qty);
        formData.append('product_id', product_id);
        formData = new URLSearchParams(formData);
        try{
            let response = await fetch(site_url+'/cart/update/', {
                method: 'POST',
                body : formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then((response) => { console.log(response); response.json() })
            .then((data) => {
                if(data.status=="success"){
                    triggerAlert(data.message,'success');
                    //window.location.href = site_url+"/cart";                
                } else {
                    triggerAlert(data.message,'error');
                }
            });
        } catch(error) {
            console.log(error);
        }
    })
});

if(document.querySelectorAll('.remove-from-cart').length > 0){
document.querySelectorAll('.remove-from-cart').forEach(item => {
    item.addEventListener('click', async (event) => {
        event.preventDefault();
        let productId = item.getAttribute('data-product');
        try{
            let response = await fetch(site_url+'/cart/delete/', {
                method: 'POST',
                body : JSON.stringify({
                    "product_id" : productId
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then((response)=> response.json())
            .then((data) => {
                if(data.status=="success"){
                    window.location.href = site_url+"/cart";
                } else {
                    triggerAlert(data.message,'error');
                }
            });
        } catch(error) {
            console.log(error.message);
        }
    })
});
}

if(document.querySelectorAll('#same-address').length > 0){
    document.querySelector('#same-address').addEventListener('click', async (event) => {
        let checked = event.target.checked;
        if(checked){
            document.querySelector('#shipping-bx').style.display = 'none';
        } else {
            document.querySelector('#shipping-bx').style.display = 'block';
        }
    })
}

if(document.querySelectorAll('input[name="paymentMethod"]').length > 0){
    document.querySelectorAll('input[name="paymentMethod"]').forEach(item => {
        item.addEventListener('click', async (event) => {
            let checkedValue = item.value;        
            document.querySelectorAll('.paymnt_option').forEach(function(el) {
                el.style.display = 'none';
            });
            if(checkedValue != ""){
                document.querySelector('#paymnt_'+checkedValue).style.display = 'block';
            } 
        })
    })
}

async function submitCheckout(frmdata){
    let formData = new FormData(frmdata)
    formData = new URLSearchParams(formData);
    try{
        let response = await fetch(site_url+'/checkout/', {
            method: 'POST',
            body : formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }).then((response)=> response.json())
        .then((data) => {
            if(data.status=="success"){
                window.location.href = site_url+"/order/thankyou/"+data.order;            
            } else {
                document.querySelector('#form-checkout > input[name="nonce"]').value = data.nonce;
                document.querySelector('#checkout_error').innerHTML = '<div class="alert alert-danger">'+data.message+'</div>';                
                document.querySelector('#form-checkout > button').removeAttribute('disabled');
                document.querySelector('#form-checkout > button').innerHTML= 'Continue to checkout';               
                document.querySelector('.detail_section').scrollIntoView({top:0, behavior:'smooth'});
            }
        });
    } catch(error) {
        console.log(error);
    }
}

if(document.querySelectorAll('#form-checkout').length > 0){
    document.querySelector('#form-checkout').addEventListener('submit', async (event) => {
        event.preventDefault();
        document.querySelector('#checkout_error').innerHTML = '';
        event.target.querySelector('button').setAttribute('disabled', true);
        event.target.querySelector('button').innerHTML= '<div class="spinner-border text-light mr-2" role="status"></div>Continue to checkout';
        let checkedPayment = document.querySelector("input[name='paymentMethod']:checked").value;
        if(checkedPayment=="stripe"){
            stripe.createToken(cardElement).then(async function(result) {
                if (result.error) {
                    resultContainer.innerHTML = '<div class="alert alert-danger" role="alert">'+result.error.message+'</div>';
                    event.target.querySelector('button').removeAttribute('disabled');
                    event.target.querySelector('button').innerHTML= 'Continue to checkout';
                } else {
                    var form = document.getElementById('form-checkout');
                    $("#stripeToken").remove();                   
                    var hiddenInput = document.createElement('input');
                    hiddenInput.setAttribute('type', 'hidden');
                    hiddenInput.setAttribute('name', 'stripeToken');
                    hiddenInput.setAttribute('id', 'stripeToken');
                    hiddenInput.setAttribute('value', result.token.id);
                    form.appendChild(hiddenInput);

                    await submitCheckout(form)
                }
            });
        } else if(checkedPayment=="cashondelivery"){
            $("#stripeToken").remove();
            await submitCheckout(event.target);
        }
    });
}
