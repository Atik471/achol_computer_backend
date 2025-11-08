import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { deleteAdminProduct, toggleAdminProductStatus } from '../services/adminProductServices';

const ProductRow = ({ product }) => {
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminProduct(product._id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      invalidateQueries();
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => toggleAdminProductStatus(product._id),
    onSuccess: () => {
      toast.success(`Product status updated`);
      invalidateQueries();
    },
    onError: () => toast.error('Failed to update status'),
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <tr className="hover">
      <td>
        <div className="flex items-center space-x-3">
          <div className="avatar">
            <div className="mask mask-squircle w-12 h-12">
              <img src={product.images[0] || '/placeholder.svg'} alt={product.name} />
            </div>
          </div>
          <div>
            <div className="font-bold">{product.name}</div>
            <div className="text-sm opacity-50">{product.brand?.name}</div>
          </div>
        </div>
      </td>
      <td>
        {product.category?.name}
        <br />
        <span className="badge badge-ghost badge-sm">{product.subcategory?.name}</span>
      </td>
      <td>৳{product.discountPrice?.toLocaleString() || product.price?.toLocaleString()}</td>
      <td>{product.stock?.inStock || 0}</td>
      <td>
        <button
          onClick={() => toggleStatusMutation.mutate()}
          className={`btn btn-ghost btn-sm ${product.isActive ? 'text-success' : 'text-error'}`}
          disabled={toggleStatusMutation.isPending}
        >
          {product.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
        </button>
      </td>
      <td>{product.featured ? 'Yes' : 'No'}</td>
      <th className="text-right">
        <Link to={`/admin/products/${product._id}/edit`} className="btn btn-ghost btn-sm">
          <FaEdit />
        </Link>
        <button
          onClick={handleDelete}
          className="btn btn-ghost btn-sm text-error"
          disabled={deleteMutation.isPending}
        >
          <FaTrash />
        </button>
      </th>
    </tr>
  );
};

export default ProductRow;