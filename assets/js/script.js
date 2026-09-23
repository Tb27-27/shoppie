class ShoppieList {
    constructor(Name) {
        this.Name = Name;
        this.List = [];
    }
}

class Product {
    constructor(Name, Amount) {
        this.Name = Name;
        this.Amount = Amount;
    }
}

var MasterList = new ShoppieList();
var ChildLists = new ShoppieList();
var ChildList = new ShoppieList();
var CurrentChildList = new ShoppieList();

const IsLookingAt = Object.freeze({
    HomeNav: "Home",
    ChildListsNav: "ChildLists",
    ChildListNav: "ChildList",
    EditProductNav: "EditProduct",
    MasterListNav: "MasterList"
});

IsLookingAt = "ChildLists";


function CreateMasterList() {
    MasterList = {};
    ChildLists.forEach (ProductList => {
        ProductList.List.forEach (ProductToAdd => {
            MasterList.List.forEach (AlreadyInMasterList => {
                if (AlreadyInMasterList.Name == ProductToAdd.Name)
                {
                    AlreadyInMasterList.Amount ++;
                }
                else 
                {
                    MasterList.List.push(ProductToAdd);
                } 
            }) 
        })
    })
}

function CreateChildList() {
    var CurrentChildListName = document.querySelector("#ChildListNameInput") ?? `Shopping List ${MasterList.List.length+1} `;
    var CurrentChildList = new ShoppieList();
    ChildLists.push(CurrentChildList);
}

function AddProduct() {
    let InputName = document.querySelector('#ProductNameInput').value;
    let InputAmount = document.querySelector('#ProductAmount').value;

    const NewProduct = new Product(InputName, InputAmount); 

    CurrentChildList.push(NewProduct);
}

function SelectChildList() {
    var CurrentChildList = MasterList.List['#SelectedChildList'];
}

function EditProduct() {
    var ProductBeingEdited = CurrentChildList.List[document.querySelector('#ProductEdit').value];
}