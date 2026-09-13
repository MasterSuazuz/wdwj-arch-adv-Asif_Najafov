The client communicates with a manager and submits a request. They then pay for a "subscription," and once payment is made, the manager initiates the order creation process. This "order" is not a one-time event.

The order consists of a "dish" and a "delivery" component; these are "weak" entities, meaning they are subject to frequent changes.

The central office oversees the managers, kitchens, and couriers. Therefore, the relationship is one-to-many. (The entire system is based on my personal experience working at a similar company.)

____________________________

OFFICE
The main organizational unit. Stores the name, phone number, and address. It is connected to managers, kitchens, and couriers.

MANAGERS
Office employees. They receive requests from clients and create orders. They also process payments.

CLIENT
A customer of the system. Sends requests to managers and makes payments, including subscription payments.

ORDER
An order created by a manager based on a client's request. Contains the order date and status. It is the owner of the weak entities DISH and DELIVERY.

DISH (weak entity)
A dish item within an order. It is identified by `order_id + dish_seq`. Contains information about allergies and quantity.

DELIVERY (weak entity)
The delivery of an order. Stores the delivery status, assigned time, delivery time, and client's address. It is performed by a courier.

KITCHENS
A kitchen belonging to an office. Supplies dishes for orders.

COURIERS
Office couriers. They perform deliveries.

PAYMENT
A client's payment. It can be associated with a subscription and is processed by a manager.

____________________________________

CLIENT → requests → MANAGERS
MANAGERS → processes → ORDER
CLIENT → makes → PAYMENT
MANAGERS → handles → PAYMENT
OFFICE → works in → MANAGERS
OFFICE → has → KITCHENS
OFFICE → employs → COURIERS
ORDER → contains → DISH (identif.)
ORDER → has → DELIVERY (identif.)
KITCHENS → supplies → DISH
COURIERS → performs → DELIVERY