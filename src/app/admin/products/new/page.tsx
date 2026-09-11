import ProductForm, { EMPTY_PRODUCT } from '../ProductForm';

export default function NewProduct() {
    return <ProductForm initial={EMPTY_PRODUCT} />;
}
